#import "NVSearchBarView.h"
#import "NVSearchResultsController.h"

#import <UIKit/UIKit.h>
#import <React/RCTBridge.h>
#import <React/RCTI18nUtil.h>
#import <React/RCTUIManager.h>
#import <React/UIView+React.h>

@implementation NVSearchBarView
{
    __weak RCTBridge *_bridge;
    UIView *_reactSubview;
    NSInteger _nativeEventCount;
}

- (id)initWithBridge:(RCTBridge *)bridge
{
    if (self = [super initWithFrame:CGRectZero]) {
        _bridge = bridge;
        self.tag = SEARCH_BAR;
        NVSearchResultsController *viewController = [[NVSearchResultsController alloc] init];
        self.searchController = [[NVSearchController alloc] initWithSearchResultsController:viewController];
        self.searchController.searchBar.semanticContentAttribute = ![[RCTI18nUtil sharedInstance] isRTL] ? UISemanticContentAttributeForceLeftToRight : UISemanticContentAttributeForceRightToLeft;
        self.searchController.searchResultsUpdater = self;
        __weak typeof(self) weakSelf = self;
        viewController.boundsDidChangeBlock = ^(CGRect newBounds) {
            [weakSelf notifyForBoundsChange:newBounds];
        };
    }
    return self;
}

- (void)setObscureBackground:(BOOL)obscureBackground
{
    if (@available(iOS 9.1, *)) {
        [self.searchController setObscuresBackgroundDuringPresentation:obscureBackground];
    }
}

- (void)setHideNavigationBar:(BOOL)hideNavigationBar
{
    [self.searchController setHidesNavigationBarDuringPresentation:hideNavigationBar];
}

- (void)setAutoCapitalize:(UITextAutocapitalizationType)autoCapitalize
{
    [self.searchController.searchBar setAutocapitalizationType:autoCapitalize];
}

- (void)setPlaceholder:(NSString *)placeholder
{
    [self.searchController.searchBar setPlaceholder:placeholder];
}

- (void)setText:(NSString *)text
{
    NSInteger eventLag = _nativeEventCount - _mostRecentEventCount;
    if (eventLag == 0 && [self.searchController.searchBar text] != text) {
        [self.searchController.searchBar setText:text];
    }
}

- (void)setBarTintColor:(UIColor *)barTintColor
{
    if (@available(iOS 13.0, *)) {
        [self.searchController.searchBar.searchTextField setBackgroundColor:barTintColor];
    }
}

- (void)didSetProps:(NSArray<NSString *> *)changedProps
{
    if (@available(iOS 11.0, *)) {
        [self.reactViewController.navigationItem setHidesSearchBarWhenScrolling:self.hideWhenScrolling];
    }
}

- (void)notifyForBoundsChange:(CGRect)newBounds
{
    if (_reactSubview) {
        [_bridge.uiManager setSize:newBounds.size forView:_reactSubview];
    }
}

- (void)insertReactSubview:(UIView *)subview atIndex:(NSInteger)atIndex
{
    [super insertReactSubview:subview atIndex:atIndex];
    self.searchController.searchResultsController.view = subview;
    _reactSubview = subview;
}

- (void)removeReactSubview:(UIView *)subview
{
    [super removeReactSubview:subview];
    _reactSubview = nil;
}

- (void)didUpdateReactSubviews
{
}

- (void)didMoveToWindow
{
    [super didMoveToWindow];
    if (@available(iOS 11.0, *)) {
        [self.reactViewController.navigationItem setSearchController:_searchController];
    }
}

- (void)willMoveToSuperview:(nullable UIView *)newSuperview
{
    [super willMoveToSuperview:newSuperview];
    if (!newSuperview) {
        if (@available(iOS 11.0, *)) {
            [self.reactViewController.navigationItem setSearchController:nil];
            [self.searchController.searchResultsController dismissViewControllerAnimated:NO completion:nil];
        }
    }
}

- (void)updateSearchResultsForSearchController:(UISearchController *)searchController {
    _nativeEventCount++;
    if (!!self.onChangeText) {
        self.onChangeText(@{
            @"text": searchController.searchBar.text,
            @"eventCount": @(_nativeEventCount),
        });
    }
}

@end

@implementation NVSearchController

- (UIStatusBarStyle)preferredStatusBarStyle
{
    return self.presentingViewController.preferredStatusBarStyle;
}

- (BOOL)prefersStatusBarHidden
{
    return self.presentingViewController.prefersStatusBarHidden;
}

@end
