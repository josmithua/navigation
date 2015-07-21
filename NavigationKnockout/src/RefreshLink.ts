﻿import LinkUtility = require('./LinkUtility');
import Navigation = require('navigation');
import ko = require('knockout');

var RefreshLink = ko.bindingHandlers['refreshLink'] = {
    init: (element, valueAccessor: () => any, allBindings: KnockoutAllBindingsAccessor) => {
        LinkUtility.addListeners(element, () => setRefreshLink(element, valueAccessor, allBindings), !!allBindings.get('lazy'));
    },
    update: (element, valueAccessor, allBindings: KnockoutAllBindingsAccessor) => {
        setRefreshLink(element, valueAccessor, allBindings);
    }
};

function setRefreshLink(element: HTMLAnchorElement, valueAccessor: () => any, allBindings: KnockoutAllBindingsAccessor) {
    var data = {};
    var toData = valueAccessor();
    toData = ko.unwrap(toData);
    var trackTypes = Navigation.StateContext.state.trackTypes;
    var active = true;
    for (var key in toData) {
        var val = ko.unwrap(toData[key]);
        data[key] = val;
        var currentVal = Navigation.StateContext.data[key];
        if (val != null && val.toString()) {
            active = active && currentVal != null && (trackTypes ? val !== currentVal : val.toString() != currentVal.toString());
        }
    }
    LinkUtility.setLink(element, () => Navigation.StateController.getRefreshLink(
        LinkUtility.getData(valueAccessor(), allBindings.get('includeCurrentData'), allBindings.get('currentDataKeys')))
    );
}
export = RefreshLink;
