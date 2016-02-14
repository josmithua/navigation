import IRouter = require('./config/IRouter');
import IHistoryManager = require('./history/IHistoryManager');

interface INavigationSettings {
    router?: IRouter;
    historyManager?: IHistoryManager;
}
export = INavigationSettings;