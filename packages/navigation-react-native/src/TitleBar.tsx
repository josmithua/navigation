import * as React from 'react'
import { requireNativeComponent, StyleSheet, Platform } from 'react-native';

const TitleBar = ({style, ...props}) => (
  <NVTitleBar {...props} style={Platform.OS === 'ios' ? [styles.titleBar, style] : style}/>
)

const NVTitleBar = requireNativeComponent<any>('NVTitleBar')

const styles = StyleSheet.create({
  titleBar: {
    position: 'absolute'
  }
})

export default TitleBar

