import './components';
import { configure as configureActionsListComponent } from './components/actions-list';

export * from './adversary-sheet';
export * from './character-sheet';

export function configure() {
    configureActionsListComponent();
}
