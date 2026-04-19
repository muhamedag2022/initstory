/// InitStory — FIXED VERSION
/// التغييرات: حذف deployer: address من create_character و mint_story
/// بدلاً منها: استخدام @initstory مباشرة
module initstory::stories {
    use std::error;
    use std::signer;
    use std::string::{Self, String};
    use std::vector;

    const E_STORY_NOT_FOUND:       u64 = 1;
    const E_NOT_OWNER:             u64 = 2;
    const E_EMPTY_PROMPT:          u64 = 3;
    const E_CHARACTER_NOT_FOUND:   u64 = 4;
    const E_INVALID_EVOLUTION_LVL: u64 = 5;

    const EVOLUTION_THRESHOLD: u64 = 3;

    struct Story has key, store {
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

    struct Character has key, store {
        id:          u64,
        owner:       address,
        name:        String,
        genre:       String,
        level:       u64,
        story_count: u64,
        total_xp:    u64,
    }

    struct Registry has key {
        story_count:     u64,
        character_count: u64,
        stories:         vector<u64>,
        characters:      vector<u64>,
    }

    struct GlobalState has key {
        total_stories:    u64,
        total_characters: u64,
        total_mints:      u64,
    }

    struct CharacterView has copy, drop, store {
        id: u64, owner: address, name: String, genre: String,
        level: u64, story_count: u64, total_xp: u64,
    }

    struct RegistryView has copy, drop, store {
        story_count: u64, character_count: u64,
    }

    // ─── Init ─────────────────────────────────────────────────────────────────
    fun init_module(deployer: &signer) {
        move_to(deployer, GlobalState {
            total_stories: 0, total_characters: 0, total_mints: 0,
        });
    }

    fun ensure_registry(account: &signer) {
        let addr = signer::address_of(account);
        if (!exists<Registry>(addr)) {
            move_to(account, Registry {
                story_count: 0, character_count: 0,
                stories: vector::empty<u64>(),
                characters: vector::empty<u64>(),
            });
        }
    }

    // ─── ✅ FIXED: لا deployer parameter ───────────────────────────────────────
    public entry fun create_character(
        account: &signer,
        name:    String,
        genre:   String,
    ) acquires Registry, GlobalState {
        ensure_registry(account);
        let addr = signer::address_of(account);
        let registry = borrow_global_mut<Registry>(addr);

        let char_id = registry.character_count;
        registry.character_count = char_id + 1;
        vector::push_back(&mut registry.characters, char_id);

        move_to(account, Character {
            id: char_id, owner: addr, name, genre,
            level: 1, story_count: 0, total_xp: 0,
        });

        // ✅ استخدام @initstory بدلاً من deployer parameter
        let global = borrow_global_mut<GlobalState>(@initstory);
        global.total_characters = global.total_characters + 1;
    }

    // ─── ✅ FIXED: لا deployer parameter ───────────────────────────────────────
    public entry fun mint_story(
        account:      &signer,
        prompt:       String,
        content:      String,
        image_uri:    String,
        genre:        String,
        character_id: u64,
        block_height: u64,
    ) acquires Registry, Story, Character, GlobalState {
        assert!(string::length(&prompt) > 0, error::invalid_argument(E_EMPTY_PROMPT));

        ensure_registry(account);
        let addr = signer::address_of(account);
        let registry = borrow_global_mut<Registry>(addr);

        let story_id = registry.story_count;
        registry.story_count = story_id + 1;
        vector::push_back(&mut registry.stories, story_id);

        move_to(account, Story {
            id: story_id, owner: addr, prompt, content,
            image_uri, genre, character_id,
            created_at: block_height, evolution_xp: 10,
        });

        if (exists<Character>(addr)) {
            let character = borrow_global_mut<Character>(addr);
            character.story_count = character.story_count + 1;
            character.total_xp    = character.total_xp + 10;

            let new_level = (character.total_xp / (EVOLUTION_THRESHOLD * 10)) + 1;
            if (new_level > 10) { new_level = 10; };
            character.level = new_level;
        };

        // ✅ استخدام @initstory بدلاً من deployer parameter
        let global = borrow_global_mut<GlobalState>(@initstory);
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
        RegistryView { story_count: r.story_count, character_count: r.character_count }
    }

    #[view]
    public fun get_character(addr: address): CharacterView acquires Character {
        assert!(exists<Character>(addr), error::not_found(E_CHARACTER_NOT_FOUND));
        let c = borrow_global<Character>(addr);
        CharacterView {
            id: c.id, owner: c.owner, name: c.name, genre: c.genre,
            level: c.level, story_count: c.story_count, total_xp: c.total_xp,
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
    public fun global_stats(): (u64, u64, u64) acquires GlobalState {
        let g = borrow_global<GlobalState>(@initstory);
        (g.total_stories, g.total_characters, g.total_mints)
    }

    // ─── Tests ────────────────────────────────────────────────────────────────
    #[test(account = @initstory)]
    fun test_create_character(account: &signer) acquires Registry, GlobalState {
        init_module(account);
        create_character(account, std::string::utf8(b"Zara"), std::string::utf8(b"fantasy"));
        let reg = get_registry(signer::address_of(account));
        assert!(reg.character_count == 1, 1);
    }

    #[test(account = @initstory)]
    fun test_mint_story_evolves_character(account: &signer) acquires Registry, Story, Character, GlobalState {
        init_module(account);
        create_character(account, std::string::utf8(b"Zara"), std::string::utf8(b"fantasy"));
        mint_story(
            account,
            std::string::utf8(b"A wanderer finds a door"),
            std::string::utf8(b"The door pulsed with light..."),
            std::string::utf8(b"ipfs://test"),
            std::string::utf8(b"fantasy"),
            0, 100,
        );
        let char = get_character(signer::address_of(account));
        assert!(char.story_count == 1, 1);
        assert!(char.total_xp == 10, 2);
    }
}