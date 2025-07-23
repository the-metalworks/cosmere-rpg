import { register as registerWeapons } from './weapons';
import { register as registerArmor } from './armor';

export function register() {
    // Register specific items
    registerWeapons();
    registerArmor();
}
