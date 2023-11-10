namespace Common {
    export function get_unique_id(used_ids: number[]): number {
        let chosen_id = 0;
        let term = false;
        used_ids.forEach((id, index) => {
            if (term) return;
            if (used_ids.length - 1 != index) {
                if (used_ids[index + 1] != id + 1) {
                    chosen_id = id + 1;
                    term = true;
                }
            } else {
                chosen_id = id + 1;
            }
        });

        return chosen_id;
    }
}

export default Common;