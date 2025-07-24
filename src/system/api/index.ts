export * from './general';
export * from './actor';
export * from './item';
export * from './style';
export * from './sheet';
export * from './helper';

import * as GeneralAPI from './general';
import * as ActorAPI from './actor';
import * as ItemAPI from './item';
import * as StyleAPI from './style';
import * as SheetAPI from './sheet';

export default {
    ...GeneralAPI,
    ...ActorAPI,
    ...ItemAPI,
    ...StyleAPI,
    ...SheetAPI,
};
