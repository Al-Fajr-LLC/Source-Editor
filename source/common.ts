namespace Common {
    /**
     * @deprecated This function is too slow. Opt for the efficient Common.UniqueIdentifierGenerator
     */
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

    export class UniqueIdentifierGenerator {
        private next_incremental_identifier = 0;
        private readonly deallocated_identifiers: number[] = [];

        public get_identifier() {
            if (this.deallocated_identifiers.length > 0) {
                const identifier = this.deallocated_identifiers[0];
                this.deallocated_identifiers.shift();
                return identifier;        
            }

            const identifier = this.next_incremental_identifier;
            this.next_incremental_identifier += 1;
            return identifier;
        }

        public deallocate_identifier(identifier: number) {
            this.deallocated_identifiers.push(identifier);

            while (
                this.deallocated_identifiers[this.deallocated_identifiers.length - 1] == this.next_incremental_identifier - 1
            ) {
                this.deallocated_identifiers.pop();
                this.next_incremental_identifier -= 1;
            }
        }
    }
}

export default Common;