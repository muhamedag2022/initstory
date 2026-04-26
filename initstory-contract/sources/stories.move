module initstory::stories {
    use std::error;
    use std::signer;
    use std::string::{Self, String};
    use std::vector;

    const E_EMPTY_PROMPT:            u64 = 3;
    const E_CHARACTER_NOT_FOUND:     u64 = 4;
    const E_CHARACTER_ALREADY_EXISTS:u64 = 5;
    const EVOLUTION_THRESHOLD:       u64 = 3;

    struct StoryData has store, drop {
        prompt:    String,
        content:   String,
        genre:     String,
        image_uri: String,
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
        stories:         vector<StoryData>,
    }

    struct GlobalState has key {
        total_stories:    u64,
        total_characters: u64,
    }

    struct CharacterView has copy, drop, store {
        id: u64, owner: address, name: String, genre: String,
        level: u64, story_count: u64, total_xp: u64,
    }

    struct RegistryView has copy, drop, store {
        story_count: u64, character_count: u64,
    }

    fun init_module(deployer: &signer) {
        move_to(deployer, GlobalState {
            total_stories: 0, total_characters: 0,
        });
    }

    fun ensure_registry(account: &signer) {
        let addr = signer::address_of(account);
        if (!exists<Registry>(addr)) {
            move_to(account, Registry {
                story_count: 0, character_count: 0,
                stories: vector::empty<StoryData>(),
            });
        }
    }

    public entry fun create_character(
        account: &signer,
        name:    String,
        genre:   String,
    ) acquires Registry, GlobalState {
        ensure_registry(account);
        let addr = signer::address_of(account);
        assert!(!exists<Character>(addr), error::already_exists(E_CHARACTER_ALREADY_EXISTS));

        let registry = borrow_global_mut<Registry>(addr);
        let char_id = registry.character_count;
        move_to(account, Character {
            id: char_id, owner: addr, name, genre,
            level: 1, story_count: 0, total_xp: 0,
        });

        registry.character_count = char_id + 1;
        let global = borrow_global_mut<GlobalState>(@initstory);
        global.total_characters = global.total_characters + 1;
    }

    public entry fun mint_story(
        account:      &signer,
        prompt:       String,
        content:      String,
        image_uri:    String,
        genre:        String,
        _character_id: u64,
        _block_height: u64,
    ) acquires Registry, Character, GlobalState {
        assert!(string::length(&prompt) > 0, error::invalid_argument(E_EMPTY_PROMPT));

        ensure_registry(account);
        let addr = signer::address_of(account);
        let registry = borrow_global_mut<Registry>(addr);

        registry.story_count = registry.story_count + 1;
        vector::push_back(&mut registry.stories, StoryData {
            prompt, content, genre, image_uri,
        });

        if (exists<Character>(addr)) {
            let character = borrow_global_mut<Character>(addr);
            character.story_count = character.story_count + 1;
            character.total_xp    = character.total_xp + 10;
            let new_level = (character.total_xp / (EVOLUTION_THRESHOLD * 10)) + 1;
            if (new_level > 10) { new_level = 10; };
            character.level = new_level;
        };

        let global = borrow_global_mut<GlobalState>(@initstory);
        global.total_stories = global.total_stories + 1;
    }

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

    #[test(account = @initstory)]
    fun test_create_character_and_mint_story(account: &signer) acquires Registry, Character, GlobalState {
        init_module(account);
        let name  = string::utf8(b"Hero");
        let genre = string::utf8(b"Fantasy");
        create_character(account, name, genre);

        let addr = signer::address_of(account);
        let reg  = get_registry(addr);
        assert!(reg.character_count == 1, 100);

        let char = get_character(addr);
        assert!(char.level == 1, 101);
        assert!(char.story_count == 0, 102);

        mint_story(
            account,
            string::utf8(b"A brave quest"),
            string::utf8(b"Once upon a time..."),
            string::utf8(b"https://img.example/1.png"),
            string::utf8(b"Fantasy"),
            0, 1,
        );

        let reg2 = get_registry(addr);
        assert!(reg2.story_count == 1, 103);
        let char2 = get_character(addr);
        assert!(char2.story_count == 1, 104);
        assert!(char2.total_xp == 10, 105);
    }

    #[test(account = @initstory)]
    fun test_character_levels_up_after_threshold(account: &signer) acquires Registry, Character, GlobalState {
        init_module(account);
        create_character(account, string::utf8(b"Mage"), string::utf8(b"Sci-Fi"));

        let i = 0;
        while (i < 3) {
            mint_story(
                account,
                string::utf8(b"prompt"),
                string::utf8(b"content"),
                string::utf8(b"uri"),
                string::utf8(b"Sci-Fi"),
                0, 1,
            );
            i = i + 1;
        };

        let addr = signer::address_of(account);
        let char = get_character(addr);
        assert!(char.total_xp == 30, 200);
        assert!(char.level >= 2, 201);
    }

    #[test(account = @initstory)]
    #[expected_failure(abort_code = 0x10003)]
    fun test_mint_story_rejects_empty_prompt(account: &signer) acquires Registry, Character, GlobalState {
        init_module(account);
        mint_story(
            account,
            string::utf8(b""),
            string::utf8(b"content"),
            string::utf8(b"uri"),
            string::utf8(b"Horror"),
            0, 1,
        );
    }
}
