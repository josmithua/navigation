import * as React from 'react';
import { requireNativeComponent, Platform, StyleSheet } from 'react-native';

const ActionBar = props => (
    Platform.OS == 'android' ? <NVActionBar {...props} style={styles.actionView} /> : null
)

const NVActionBar = requireNativeComponent<any>('NVActionBar')

const styles = StyleSheet.create({
    actionView: {
        flex: 1,
    },
});

export default ActionBar;
