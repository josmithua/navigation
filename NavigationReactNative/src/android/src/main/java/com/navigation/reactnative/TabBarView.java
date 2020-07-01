package com.navigation.reactnative;

import android.content.Context;
import android.view.View;
import android.view.ViewGroup;

import androidx.coordinatorlayout.widget.CoordinatorLayout;
import androidx.fragment.app.FragmentActivity;
import androidx.fragment.app.FragmentTransaction;

import com.facebook.react.bridge.ReactContext;

import java.util.ArrayList;
import java.util.List;

public class TabBarView extends ViewGroup {
    List<TabFragment> tabFragments = new ArrayList<>();

    public TabBarView(Context context) {
        super(context);
    }

    @Override
    protected void onAttachedToWindow() {
        super.onAttachedToWindow();
        FragmentActivity activity = (FragmentActivity) ((ReactContext) getContext()).getCurrentActivity();
        FragmentTransaction transaction = activity.getSupportFragmentManager().beginTransaction();
        transaction.add(getId(), tabFragments.get(0), "TabBar" + getId());
        transaction.commit();
    }

    void populateTabs() {
        TabNavigationView tabNavigation = getTabNavigation();
        if (tabNavigation != null) {
            for(int i = 0; i < tabFragments.size(); i++) {
                tabFragments.get(i).tabBarItem.setTabView(tabNavigation, i);
            }
        }
    }

    private TabNavigationView getTabNavigation() {
        ViewGroup parent = (ViewGroup) getParent();
        for(int i = 0; parent != null && i < parent.getChildCount(); i++) {
            View child = parent.getChildAt(i);
            if (child instanceof TabNavigationView)
                return (TabNavigationView) child;
        }
        return null;
    }

    @Override
    protected void onLayout(boolean changed, int l, int t, int r, int b) {
    }
}
