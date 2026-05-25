import './components';
import { configure as configureActionsListComponent } from './components/actions-list';
import { configure as configureTalentsListComponent } from './components/character/talents-list';

export * from './adversary-sheet';
export * from './character-sheet';

export function configure() {
    configureActionsListComponent();
    configureTalentsListComponent();
}
