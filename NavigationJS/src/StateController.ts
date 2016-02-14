﻿import ConverterFactory = require('./converter/ConverterFactory');
import Crumb = require('./config/Crumb');
import Dialog = require('./config/Dialog');
import IDialog = require('./config/IDialog');
import HashHistoryManager = require('./history/HashHistoryManager');
import HistoryAction = require('./history/HistoryAction');
import IHistoryManager = require('./history/IHistoryManager');
import ReturnDataManager = require('./ReturnDataManager');
import State = require('./config/State');
import IState = require('./config/IState');
import StateContext = require('./StateContext');
import StateInfoConfig = require('./StateInfoConfig');
import IRouter = require('./config/IRouter');
import StateRouter = require('./StateRouter');
import Transition = require('./config/Transition');
import ITransition = require('./config/ITransition');

class StateController {
    private NAVIGATE_HANDLER_ID = 'navigateHandlerId';
    private navigateHandlerId: number = 1;
    private navigateHandlers: { [index: string]: (oldState: State, state: State, data: any) => void } = {};
    private converterFactory: ConverterFactory = new ConverterFactory();
    private router: IRouter = new StateRouter();
    stateContext: StateContext = new StateContext();
    historyManager: IHistoryManager;
    dialogs: { [index: string]: Dialog } = {};
    _dialogs: Dialog[] = [];
    
    constructor(dialogs?: IDialog<string, IState<ITransition<string>[]>[]>[], historyManager?: IHistoryManager) {
        if (dialogs)
            this.configure(dialogs, historyManager);
    }
    
    configure(dialogs: IDialog<string, IState<ITransition<string>[]>[]>[], historyManager?: IHistoryManager) {
        if (this.historyManager)
            this.historyManager.stop();
        this.historyManager = historyManager ? historyManager : new HashHistoryManager();
        this.historyManager.init(() => {
            if (this.stateContext.url === this.historyManager.getCurrentUrl())
                return;
            this.navigateLink(this.historyManager.getCurrentUrl(), undefined, true);
        });
        var config = StateInfoConfig.build(dialogs, this.converterFactory);
        this._dialogs = config._dialogs;
        this.dialogs = config.dialogs;
        this.router.addRoutes(this._dialogs);
    }

    private setStateContext(state: State, url: string) {
        try {
            this.setOldStateContext();
            this.stateContext.state = state;
            this.stateContext.url = url;
            this.stateContext.dialog = state.parent;
            this.stateContext.title = state.title;
            this.stateContext.data = this.parseNavigationLink(url, state).data;
            this.stateContext.crumbTrail = [];
            this.stateContext.previousState = null;
            this.stateContext.previousDialog = null;
            this.stateContext.previousData = {};
            if (this.stateContext.data.crumb)
                this.stateContext.crumbTrail = this.stateContext.data.crumb;
            delete this.stateContext.data.crumb;
            this.buildCrumbTrail(false);
            this.stateContext.crumbs = this.getCrumbs(true);
            this.setPreviousStateContext(false);
            this.stateContext.crumblessUrl = this.getHref(this.stateContext.state, this.stateContext.data, []);
        } catch (e) {
            throw new Error('The Url is invalid\n' + e.message);
        }
    }

    clearStateContext() {
        this.stateContext.oldState = null;
        this.stateContext.oldDialog = null;
        this.stateContext.oldData = {};
        this.stateContext.previousState = null;
        this.stateContext.previousDialog = null;
        this.stateContext.previousData = {};
        this.stateContext.state = null;
        this.stateContext.dialog = null;
        this.stateContext.data = {};
        this.stateContext.url = null;
        this.stateContext.crumblessUrl = null;
        this.stateContext.title = null;
        this.stateContext.crumbs = [];
        this.stateContext.crumbTrail = [];
        this.stateContext.crumbTrailKey = null;
    }
    
    private setOldStateContext() {
        if (this.stateContext.state) {
            this.stateContext.oldState = this.stateContext.state;
            this.stateContext.oldDialog = this.stateContext.dialog;
            this.stateContext.oldData = this.stateContext.data;
        }
    }
    
    private setPreviousStateContext(uncombined: boolean) {
        if (this.stateContext.crumbs.length > 0) {
            var previousStateCrumb = this.stateContext.crumbs[this.stateContext.crumbs.length - 1];
            this.stateContext.previousState = previousStateCrumb.state;
            this.stateContext.previousDialog = this.stateContext.previousState.parent;
            this.stateContext.previousData = previousStateCrumb.data;
        }
    }
    
    private buildCrumbTrail(uncombined: boolean) {
        var crumbs = this.getCrumbs(false);
        crumbs = this.stateContext.state.stateHandler.truncateCrumbTrail(this.stateContext.state, crumbs);
        var crumbTrail = [];
        for(var i = 0; i < crumbs.length; i++)
            crumbTrail.push(crumbs[i].crumblessLink);
        this.stateContext.crumbTrail = crumbTrail;
    }

    private getCrumbs(setLast: boolean): Crumb[] {
        var crumbTrailArray: Crumb[] = [];
        var len = this.stateContext.crumbTrail.length;
        for(var i = 0; i < len; i++) {
            var crumblessLink = this.stateContext.crumbTrail[i];
            var { state, data } = this.parseNavigationLink(crumblessLink);
            var link = this.getHref(state, data, this.stateContext.crumbTrail.slice(0, i));
            crumbTrailArray.push(new Crumb(data, state, link, crumblessLink, i === len - 1));            
        }
        return crumbTrailArray;
    }
    
    onNavigate(handler: (oldState: State, state: State, data: any) => void) {
        if (!handler[this.NAVIGATE_HANDLER_ID]) {
            var id = this.NAVIGATE_HANDLER_ID + this.navigateHandlerId++;
            handler[this.NAVIGATE_HANDLER_ID] = id;
            this.navigateHandlers[id] = handler;
        } else {
            throw new Error('Cannot add the same handler more than once');
        }
    }

    offNavigate(handler: (oldState: State, state: State, data: any) => void) {
        delete this.navigateHandlers[handler[this.NAVIGATE_HANDLER_ID]];
        delete handler[this.NAVIGATE_HANDLER_ID];
    }

    navigate(action: string, toData?: any, historyAction?: HistoryAction) {
        var url = this.getNavigationLink(action, toData);
        if (url == null)
            throw new Error('Invalid route data, a mandatory route parameter has not been supplied a value');
        this._navigateLink(url, this.getNextState(action), historyAction);
    }

    getNavigationLink(action: string, toData?: any): string {
        return this.getHref(this.getNextState(action), toData);
    }

    private getHref(state: State, navigationData: any, crumbs?: string[]): string {
        var data = {};
        var arrayData: { [index: string]: string[] } = {};
        for (var key in navigationData) {
            var val = navigationData[key]; 
            if (val != null && val.toString())
                this.formatData(state, key, val, data, arrayData);
        }
        if (!crumbs) {
            crumbs = this.stateContext.crumbTrail.slice();
            if (this.stateContext.crumblessUrl)
                crumbs.push(this.stateContext.crumblessUrl);
        }
        if (state.trackCrumbTrail && crumbs.length > 0)
            this.formatData(state, 'crumb', crumbs, data, arrayData);
        return state.stateHandler.getNavigationLink(this.router, state, data, arrayData);
    }
    
    private formatData(state: State, key: string, val: any, data: any, arrayData: any) {
        var formattedData = ReturnDataManager.formatURLObject(this.converterFactory, key, val, state);
        val = formattedData.val;
        if (val !== state.formattedDefaults[key]) {
            data[key] = val;
            arrayData[key] = formattedData.arrayVal;
        }
    }

    private getRefreshHref(refreshData: any): string {
        return this.getHref(this.stateContext.state, refreshData);
    }
    
    canNavigateBack(distance: number) {
        var canNavigate = false;
        if (distance <= this.stateContext.crumbs.length && distance > 0)
            canNavigate = true;
            return canNavigate
        }

    navigateBack(distance: number, historyAction?: HistoryAction) {
        var url = this.getNavigationBackLink(distance);
        if (url == null)
            throw new Error('Invalid route data, a mandatory route parameter has not been supplied a value');
        this._navigateLink(url, this.getCrumb(distance).state, historyAction);
    }

    getNavigationBackLink(distance: number): string {
        return this.getCrumb(distance).navigationLink;
    }

    refresh(toData?: any, historyAction?: HistoryAction) {
        var url = this.getRefreshLink(toData);
        if (url == null)
            throw new Error('Invalid route data, a mandatory route parameter has not been supplied a value');
        this._navigateLink(url, this.stateContext.state, historyAction);
    }

    getRefreshLink(toData?: any): string {
        return this.getRefreshHref(toData);
    }

    navigateLink(url: string, historyAction?: HistoryAction, history?: boolean) {
        try {
            var state = this.router.getData(url.split('?')[0]).state;
        } catch (e) {
            throw new Error('The Url is invalid\n' + e.message);
        }
        this._navigateLink(url, state, historyAction, history);
    }

    private _navigateLink(url: string, state: State, historyAction = HistoryAction.Add, history = false) {
        try {
            var oldUrl = this.stateContext.url;
            var data = this.parseNavigationLink(url, state).data;
        } catch (e) {
            throw new Error('The Url is invalid\n' + e.message);
        }
        var navigateContinuation =  this.getNavigateContinuation(oldUrl, state, url, historyAction);
        var unloadContinuation = () => {
            if (oldUrl === this.stateContext.url)
                state.navigating(data, url, navigateContinuation, history);
        };
        if (this.stateContext.state)
            this.stateContext.state.unloading(state, data, url, unloadContinuation, history);
        else
            state.navigating(data, url, navigateContinuation, history);
    }
    
    private getNavigateContinuation(oldUrl: string, state: State, url: string, historyAction: HistoryAction): () => void {
        return (asyncData?: any) => {
            if (oldUrl === this.stateContext.url) {
                state.stateHandler.navigateLink(this.stateContext.state, state, url);
                this.setStateContext(state, url);
                if (this.stateContext.oldState && this.stateContext.oldState !== state)
                    this.stateContext.oldState.dispose();
                state.navigated(this.stateContext.data, asyncData);
                for (var id in this.navigateHandlers) {
                    if (url === this.stateContext.url)
                        this.navigateHandlers[id](this.stateContext.oldState, state, this.stateContext.data);
                }
                if (url === this.stateContext.url) {
                    if (historyAction !== HistoryAction.None)
                        this.historyManager.addHistory(url, historyAction === HistoryAction.Replace);
                    if (this.stateContext.title && (typeof document !== 'undefined'))
                        document.title = this.stateContext.title;
                }
            }
        };
    }
    
    parseNavigationLink(url: string, state?: State): { state: State, data: any } {
        if (!state)
            state = this.router.getData(url.split('?')[0]).state;
        var { data, separableData } = state.stateHandler.getNavigationData(this.router, state, url);
        data = this.parseData(data, state, separableData);
        return { state: state, data: data };
    }

    private parseData(data: any, state: State, separableData: any): any {
        var newData = {};
        for (var key in data) {
            if (!this.isDefault(key, data, state, !!separableData[key]))
                newData[key] = ReturnDataManager.parseURLString(this.converterFactory, key, data[key], state, false, !!separableData[key]);
        }
        for (var key in state.defaults) {
            if (newData[key] == null || !newData[key].toString())
                newData[key] = state.defaults[key];
        }
        return newData;
    }
    
    private isDefault(key: string, data: any, state: State, separable: boolean) {
        var val = data[key]
        var arrayDefaultVal = state.formattedArrayDefaults[key];
        if (!separable || !arrayDefaultVal) {
            return val === state.formattedDefaults[key];
        } else {
            if (typeof val === 'string')
                val = [val];
            if (val.length !== arrayDefaultVal.length) 
                return false;
            for(var i = 0; i < val.length; i++) {
                if (val[i] !== arrayDefaultVal[i])
                    return false;
            }
            return true;
        }
    }

    getNextState(action: string): State {
        var nextState: State = null;
        if (this.stateContext.state && this.stateContext.state.transitions[action])
            nextState = this.stateContext.state.transitions[action].to;
        if (!nextState && this.dialogs[action])
            nextState = this.dialogs[action].initial;
        if (!nextState)
            throw new Error('The action parameter must be a Dialog key or a Transition key that is a child of the current State');
        return nextState;
    }

    private getCrumb(distance: number): Crumb {
        if (distance > this.stateContext.crumbs.length || distance <= 0)
            throw new Error('The distance parameter must be greater than zero and less than or equal to the number of Crumbs (' + this.stateContext.crumbs.length + ')');
        return this.stateContext.crumbs[this.stateContext.crumbs.length - distance];
    }
    
    start(url?: string) {
        this.navigateLink(url ? url : this.historyManager.getCurrentUrl());
    };
}
export = StateController;
