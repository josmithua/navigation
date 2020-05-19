package com.navigation.reactnative;

import android.content.Context;
import android.view.MenuItem;
import android.view.View;
import android.view.ViewGroup;
import android.view.inputmethod.InputMethodManager;
import android.widget.ImageButton;

import androidx.appcompat.widget.SearchView;
import androidx.appcompat.widget.Toolbar;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.PixelUtil;
import com.facebook.react.uimanager.events.RCTEventEmitter;
import com.facebook.react.views.view.ReactViewGroup;
import com.google.android.material.appbar.AppBarLayout;

public class SearchBarView extends ReactViewGroup {
    SearchView searchView;
    AppBarLayout.OnOffsetChangedListener onOffsetChangedListener;
    private int barOffset = 0;
    int nativeEventCount;
    int mostRecentEventCount;

    public SearchBarView(Context context) {
        super(context);
        searchView = new SearchView(context);
        searchView.setOnQueryTextListener(new SearchView.OnQueryTextListener() {
            @Override
            public boolean onQueryTextSubmit(String query) {
                return false;
            }

            @Override
            public boolean onQueryTextChange(String newText) {
                nativeEventCount++;
                WritableMap event = Arguments.createMap();
                event.putString("text", newText);
                event.putInt("eventCount", nativeEventCount);
                ReactContext reactContext = (ReactContext) getContext();
                reactContext.getJSModule(RCTEventEmitter.class).receiveEvent(getId(),"onChangeText", event);
                return false;
            }
        });
        searchView.setOnQueryTextFocusChangeListener(new OnFocusChangeListener() {
            @Override
            public void onFocusChange(View v, boolean hasFocus) {
                if (hasFocus) {
                    NavigationBarView navigationBarView = getNavigationBarView();
                    if (navigationBarView != null) {
                        Toolbar toolbarView = (Toolbar) searchView.getParent();
                        ImageButton arrowButton = (ImageButton) toolbarView.getChildAt(1);
                        arrowButton.setColorFilter(navigationBarView.getTintColor());
                    }
                }
            }
        });
        onOffsetChangedListener = new AppBarLayout.OnOffsetChangedListener() {
            @Override
            public void onOffsetChanged(AppBarLayout appBarLayout, int offset) {
                barOffset = offset;
            }
        };
    }

    void setQuery(String query) {
        int eventLag = nativeEventCount - mostRecentEventCount;
        if (eventLag == 0 && !searchView.getQuery().toString().equals(query))
            searchView.setQuery(query, true);
    }

    void setBarTintColor(Integer barTintColor) {
        SearchView.SearchAutoComplete searchAutoComplete = getAutoComplete();
        if (barTintColor != null) {
            searchAutoComplete.setBackgroundColor(barTintColor);
        } else {
            searchAutoComplete.setBackground(null);
        }
    }

    @Override
    protected void onAttachedToWindow() {
        super.onAttachedToWindow();
        if (searchView.requestFocusFromTouch()) {
            InputMethodManager inputMethodManager = (InputMethodManager) getContext().getSystemService(Context.INPUT_METHOD_SERVICE);
            if (inputMethodManager != null)
                inputMethodManager.showSoftInput(searchView.findFocus(), 0);
        }
        ToolbarView toolbarView = null;
        final NavigationBarView navigationBarView = getNavigationBarView();
        if (navigationBarView != null) {
            for (int i = 0; i < navigationBarView.getChildCount(); i++) {
                if (navigationBarView.getChildAt(i) instanceof ToolbarView)
                    toolbarView = (ToolbarView) navigationBarView.getChildAt(i);
            }
            navigationBarView.addOnOffsetChangedListener(onOffsetChangedListener);
        }
        if (toolbarView != null) {
            toolbarView.setOnSearchListener(new ToolbarView.OnSearchListener() {
                @Override
                public void onSearchAdd(MenuItem searchMenuItem) {
                    searchMenuItem.setActionView(searchView);
                }

                @Override
                public void onSearchExpand() {
                    ReactContext reactContext = (ReactContext) getContext();
                    WritableMap event = Arguments.createMap();
                    event.putInt("top", 56 + (int) PixelUtil.toDIPFromPixel(barOffset));
                    reactContext.getJSModule(RCTEventEmitter.class).receiveEvent(getId(),"onExpand", event);
                }

                @Override
                public void onSearchCollapse() {
                    ReactContext reactContext = (ReactContext) getContext();
                    reactContext.getJSModule(RCTEventEmitter.class).receiveEvent(getId(),"onCollapse", null);
                }
            });
        }
    }

    @Override
    protected void onDetachedFromWindow() {
        super.onDetachedFromWindow();
        NavigationBarView navigationBarView = getNavigationBarView();
        if (navigationBarView != null)
            navigationBarView.removeOnOffsetChangedListener(onOffsetChangedListener);
    }

    private NavigationBarView getNavigationBarView() {
        ViewGroup view = (ViewGroup) getParent();
        for(int i = 0; i < view.getChildCount(); i++) {
            if (view.getChildAt(i) instanceof  CoordinatorLayoutView)
                view = (CoordinatorLayoutView) view.getChildAt(i);
        }
        for(int i = 0; i < view.getChildCount(); i++) {
            if (view.getChildAt(i) instanceof NavigationBarView) {
                return (NavigationBarView) view.getChildAt(i);
            }
        }
        return null;
    }

    private SearchView.SearchAutoComplete getAutoComplete() {
        return searchView.findViewById(androidx.appcompat.R.id.search_src_text);
    }

    @Override
    protected void onLayout(boolean changed, int l, int t, int r, int b) {
    }
}
