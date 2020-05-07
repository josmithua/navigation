#import "NVNavigationBarView.h"

#import <React/UIView+React.h>

@implementation NVNavigationBarView

- (id)init
{
    if (self = [super init]) {
        self.tag = NAVIGATION_BAR;
    }
    return self;
}

- (void)didSetProps:(NSArray<NSString *> *)changedProps
{
    [super didSetProps:changedProps];
    [self.reactViewController.navigationController setNavigationBarHidden:self.hidden];
    if ([changedProps containsObject:@"title"]) {
        [self.reactViewController.navigationItem setTitle:self.title];
    }
    if ([changedProps containsObject:@"backTitle"]) {
        NSInteger crumb = [self.reactViewController.navigationController.viewControllers indexOfObject:self.reactViewController];
        UIViewController *previousController = crumb > 0 ? [self.reactViewController.navigationController.viewControllers objectAtIndex:crumb - 1] : nil;
        previousController.navigationItem.backBarButtonItem = nil;
        if (self.backTitle != nil) {
            previousController.navigationItem.backBarButtonItem = [[UIBarButtonItem alloc] initWithTitle:self.backTitle style:UIBarButtonItemStylePlain target:nil action:nil];
        }
    }
    [self updateColors];
}

- (void)willMoveToSuperview:(nullable UIView *)newSuperview
{
    [super willMoveToSuperview:newSuperview];
    if (!newSuperview) {
        [self.reactViewController.navigationController setNavigationBarHidden:false];
    }
}

-(void)updateColors {
    UINavigationBar *navigationBar = self.reactViewController.navigationController.navigationBar;
    if (@available(iOS 13.0, *)) {
    } else {
        [navigationBar setBarTintColor:self.barTintColor];
        [navigationBar setTintColor: self.tintColor];
        [navigationBar setTitleTextAttributes:[self setForeground:self.titleColor :navigationBar.titleTextAttributes]];
        if (@available(iOS 11.0, *)) {
            [navigationBar setLargeTitleTextAttributes:[self setForeground:self.titleColor :navigationBar.largeTitleTextAttributes]];
        }
    }
}

-(NSDictionary *)setForeground:(UIColor *)color :(NSDictionary *)attributes
{
    NSMutableDictionary *attributesCopy = attributes != nil ? [attributes mutableCopy] : @{}.mutableCopy;
    [attributesCopy removeObjectForKey:NSForegroundColorAttributeName];
    if (color != nil)
        attributesCopy[NSForegroundColorAttributeName] = color;
    return attributesCopy;
}

@end
