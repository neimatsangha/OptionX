module optionx::time_utils {
    use aptos_framework::timestamp;

    /// Returns the current timestamp in seconds.
    public fun get_current_time(): u64 {
        timestamp::now_seconds()
    }

    /// Checks if the current time is past a given expiry timestamp.
    public fun is_past(expiry_timestamp: u64): bool {
        let current_time = get_current_time();
        current_time >= expiry_timestamp
    }
}