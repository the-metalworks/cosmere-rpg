import { register as registerItems } from './items';
import { register as registerCurrency } from './currency';
import { register as registerAncestries } from './ancestries';
import { register as registerCultures } from './cultures';

export function register() {
    registerCurrency();
    registerItems();
    registerAncestries();
    registerCultures();
}
