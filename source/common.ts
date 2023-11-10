namespace Common {
    export function get_unique_id(used_ids: number[]): number {
        used_ids.sort((a, b) => a - b);

        let chosen_id = 0;
        
        function recurse() {
            if (used_ids.includes(chosen_id)) {
                chosen_id++;
                recurse();
            }
        }

        recurse();

        return chosen_id;
    }
}

export default Common;