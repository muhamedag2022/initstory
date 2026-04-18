/// InitStory — AI-powered storytelling appchain on Initia
///
/// Users write a short prompt → AI generates a story scene → minted as an on-chain NFT.
/// Characters evolve with each new story, tracked entirely on-chain.
/// Auto-signing enables seamless minting without repeated wallet popups.
module initstory::stories {
    use std::error;
    use std::signer;
    use std::string::{Self, String};
    use std::vector;

    // ─── Error Codes ───────────────────────────────────────────────────────────
    const E_STORY_NOT_FOUND:       u64 = 1;
    const E_NOT_OWNER:             u64 = 2;
    const E_EMPTY_PROMPT:          u64 = 3;
    const E_CHARACTER_NOT_FOUND:   u64 = 4;
    const E_INVALID_EVOLUTION_LVL: u64 = 5;

    // ─── Constants ─────────────────────────────────────────────────────────────
    const MAX_PROMPT_LENGTH:   u64 = 280;
    const MAX_CONTENT_LENGTH:  u64 = 2000;
    const EVOLUTION_THRESHOLD: u64 = 3; // stories needed per level-up

    // ─── Structs ───────────────────────────────────────────────────────────────

    /// A single minted story (NFT-like object stored under owner address)
    struct Story has key, store {
        id:           u64,
        owner:        address,
        prompt:       String,
        content:      String,   // AI-generated narrative text
        image_uri:    String,   // AI-generated image URI (IPFS / hosted)
        genre:        String,   // "fantasy" | "sci-fi" | "mystery" | "adventure"
        character_id: u64,      // links to a Character owned by the same user
        created_at:   u64,      // block height
        evolution_xp: u64,      // XP contributed to the character
    }

    /// A character that grows across stories
    struct Character has key, store {
        id:          u64,
        owner:       address,
        name:        String,
        genre:       String,
        level:       u64,       // starts at 1, max 10
        story_count: u64,
        total_xp:    u64,
    }

    /// Global registry — one per user address
    struct Registry has key {
        story_count:     u64,
        character_count: u64,
        stories:         vector<u64>,     // story IDs
        characters:      vector<u64>,     // character IDs
    }

    /// Platform-wide counters (stored under module deployer)
    struct GlobalState has key {
        total_stories:    u64,
        total_characters: u64,
        total_mints:      u64,
    }

    // ─── View Types (copy/drop so they can be returned) ────────────────────────
    struct StoryView has copy, drop, store {
        id:           u64,
        owner:        address,
        prompt:       String,
        content:      String,
        image_uri:    String,
        genre:        String,
        character_id: u64,
        created_at:   u64,
        evolution_xp: u64,
    }

    struct CharacterView has copy, drop, store {
        id:          u64,
        owner:       address,
        name:        String,
        genre:       String,
        level:       u64,
        story_count: u64,
        total_xp:    u64,
    }

    struct RegistryView has copy, drop, store {
        story_count:     u64,
        character_count: u64,
    }

    // ─── Initializer ───────────────────────────────────────────────────────────

    fun init_module(deployer: &signer) {
        move_to(deployer, GlobalState {
            total_stories:    0,
            total_characters: 0,
            total_mints:      0,
        });
    }

    // ─── Registry helpers ──────────────────────────────────────────────────────

    fun ensure_registry(account: &signer) {
        let addr = signer::address_of(account);
        if (!exists<Registry>(addr)) {
            move_to(account, Registry {
                story_count:     0,
                character_count: 0,
                stories:         vector::empty<u64>(),
                characters:      vector::empty<u64>(),
            });
        }
    }

    // ─── Public Entry Functions ────────────────────────────────────────────────

    /// Create a new character for the user (prerequisite for minting stories)
    public entry fun create_character(
        account:    &signer,
        name:       String,
        genre:      String,
        deployer:   address,
    ) acquires Registry, GlobalState {
        ensure_registry(account);
        let addr = signer::address_of(account);
        let registry = borrow_global_mut<Registry>(addr);

        let char_id = registry.character_count;
        registry.character_count = char_id + 1;

        vector::push_back(&mut registry.characters, char_id);

        move_to(account, Character {
            id:          char_id,
            owner:       addr,
            name,
            genre,
            level:       1,
            story_count: 0,
            total_xp:    0,
        });

        let global = borrow_global_mut<GlobalState>(deployer);
        global.total_characters = global.total_characters + 1;
    }

    /// Mint a story NFT — called after AI generation on the backend
    /// `content` and `image_uri` are supplied by the backend/AI layer
    public entry fun mint_story(
        account:      &signer,
        prompt:       String,
        content:      String,
        image_uri:    String,
        genre:        String,
        character_id: u64,
        block_height: u64,
        deployer:     address,
    ) acquires Registry, Story, Character, GlobalState {
        // Validate inputs
        assert!(string::length(&prompt) > 0,   error::invalid_argument(E_EMPTY_PROMPT));
        assert!(string::length(&prompt) <= MAX_PROMPT_LENGTH, error::invalid_argument(E_EMPTY_PROMPT));

        ensure_registry(account);
        let addr = signer::address_of(account);
        let registry = borrow_global_mut<Registry>(addr);

        let story_id = registry.story_count;
        registry.story_count = story_id + 1;
        vector::push_back(&mut registry.stories, story_id);

        move_to(account, Story {
            id: story_id,
            owner: addr,
            prompt,
            content,
            image_uri,
            genre,
            character_id,
            created_at: block_height,
            evolution_xp: 10, // base XP per story
        });

        // Evolve the character
        if (exists<Character>(addr)) {
            let character = borrow_global_mut<Character>(addr);
            character.story_count = character.story_count + 1;
            character.total_xp    = character.total_xp + 10;

            // Level up every EVOLUTION_THRESHOLD stories, max level 10
            let new_level = (character.total_xp / (EVOLUTION_THRESHOLD * 10)) + 1;
            if (new_level > 10) { new_level = 10; };
            character.level = new_level;
        };

        // Update global stats
        let global = borrow_global_mut<GlobalState>(deployer);
        global.total_stories = global.total_stories + 1;
        global.total_mints   = global.total_mints + 1;
    }

    // ─── View Functions ────────────────────────────────────────────────────────

    #[view]
    public fun get_registry(addr: address): RegistryView acquires Registry {
        if (!exists<Registry>(addr)) {
            return RegistryView { story_count: 0, character_count: 0 }
        };
        let r = borrow_global<Registry>(addr);
        RegistryView {
            story_count:     r.story_count,
            character_count: r.character_count,
        }
    }

    #[view]
    public fun get_character(addr: address): CharacterView acquires Character {
        assert!(exists<Character>(addr), error::not_found(E_CHARACTER_NOT_FOUND));
        let c = borrow_global<Character>(addr);
        CharacterView {
            id:          c.id,
            owner:       c.owner,
            name:        c.name,
            genre:       c.genre,
            level:       c.level,
            story_count: c.story_count,
            total_xp:    c.total_xp,
        }
    }

    #[view]
    public fun story_count(addr: address): u64 acquires Registry {
        if (!exists<Registry>(addr)) { return 0 };
        borrow_global<Registry>(addr).story_count
    }

    #[view]
    public fun character_level(addr: address): u64 acquires Character {
        if (!exists<Character>(addr)) { return 0 };
        borrow_global<Character>(addr).level
    }

    #[view]
    public fun global_stats(deployer: address): (u64, u64, u64) acquires GlobalState {
        let g = borrow_global<GlobalState>(deployer);
        (g.total_stories, g.total_characters, g.total_mints)
    }

    // ─── Unit Tests ─────────────────────────────────────────────────────────────

    #[test_only]
    use std::string;

    #[test(account = @initstory)]
    fun test_create_character_and_mint_story(account: &signer) acquires Registry, Story, Character, GlobalState {
        // bootstrap global state for test
        init_module(account);
        let addr = signer::address_of(account);

        create_character(
            account,
            string::utf8(b"Zara"),
            string::utf8(b"fantasy"),
            addr,
        );

        let char_view = get_character(addr);
        assert!(char_view.level == 1,       1);
        assert!(char_view.story_count == 0, 2);

        mint_story(
            account,
            string::utf8(b"A wanderer finds a glowing door in the desert"),
            string::utf8(b"The door pulsed with amber light..."),
            string::utf8(b"ipfs://Qm_test_image"),
            string::utf8(b"fantasy"),
            0,
            100,
            addr,
        );

        let reg = get_registry(addr);
        assert!(reg.story_count == 1, 3);

        let char2 = get_character(addr);
        assert!(char2.story_count == 1, 4);
        assert!(char2.total_xp == 10,   5);
    }

    #[test(account = @initstory)]
    fun test_character_levels_up_after_threshold(account: &signer) acquires Registry, Story, Character, GlobalState {
        init_module(account);
        let addr = signer::address_of(account);

        create_character(account, string::utf8(b"Rael"), string::utf8(b"sci-fi"), addr);

        // Mint 3 stories → should trigger level-up to 2
        let i = 0u64;
        while (i < 3) {
            mint_story(
                account,
                string::utf8(b"story prompt"),
                string::utf8(b"story content"),
                string::utf8(b"ipfs://img"),
                string::utf8(b"sci-fi"),
                0,
                i,
                addr,
            );
            i = i + 1;
        };

        let char = get_character(addr);
        assert!(char.story_count == 3,  1);
        assert!(char.total_xp    == 30, 2);
        assert!(char.level       >= 2,  3);
    }

    #[test(account = @initstory)]
    #[expected_failure(abort_code = 0x10003)]
    fun test_mint_story_rejects_empty_prompt(account: &signer) acquires Registry, Story, Character, GlobalState {
        init_module(account);
        let addr = signer::address_of(account);
        create_character(account, string::utf8(b"X"), string::utf8(b"mystery"), addr);
        mint_story(
            account,
            string::utf8(b""),   // ← empty prompt should abort
            string::utf8(b"content"),
            string::utf8(b"ipfs://img"),
            string::utf8(b"mystery"),
            0,
            1,
            addr,
        );
    }
}
