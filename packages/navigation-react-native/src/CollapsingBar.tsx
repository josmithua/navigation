import * as React from 'react';
import { requireNativeComponent, Platform } from 'react-native';

var CollapsingBar: any = ({largeTitle = false, barTintColor, titleColor, style, ...props}) => (
    <NVCollapsingBar
        titleEnabled={largeTitle}
        contentScrimColor={barTintColor}
        collapsedTitleColor={titleColor}
        expandedTitleColor={titleColor}
        {...props} />
)

var NVCollapsingBar = requireNativeComponent<any>('NVCollapsingBar');

export default Platform.OS === "android" ? CollapsingBar : () => null;
