
/**
 * @import
 */
import AutoIterator from './AutoIterator.js';

export default class AutoAsyncIterator extends AutoIterator {

    async createIterator() {
        if ( this.spec.kind === 'for-in' ) return ( function* () { for ( let key in this.iteratee ) yield key; } ).call( this );
        if ( this.spec.kind === 'for-of' ) return ( function* () { for ( let val of this.iteratee ) yield val; } ).call( this );
        return { next: async () => ({ done: !( await this.pseudorun( () => this.spec.test( this ) ) ), }), };
    }

    async closure() {
        if ( [ 'for-of', 'for-in' ].includes( this.spec.kind ) ) {
            [ this.production, this.iteratee ] = await this.spec.parameters( this );
            this.iterator = await this.createIterator();
            this.iterator.original = true;
            this.watchMode();
        } else {
            if ( this.spec.kind === 'for' ) { await this.spec.init( this ); }
            this.iterator = await this.createIterator();
        }
        await this.iterate();
    }

    async iterate() {
        let cursor; this.iterating = true;
        const $test = async () => ( !this.terminated()/* must come before */ && ( this.cursor = this.iterator.next() ) && ( cursor = await this.cursor ) && !cursor.done );
        const $round = async () => {
            const round = this.createRound( cursor.value );
            await round.execute();
            await this.advance();
        };
        if ( this.spec.kind === 'do-while' ) { do await $round(); while ( await $test() ); }
        else { while ( await $test() ) await $round(); }
        this.iterating = false;
    }

}