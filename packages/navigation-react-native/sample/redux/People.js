import React from 'react';
import {ScrollView, FlatList} from 'react-native';
import {NavigationBar} from 'navigation-react-native';
import {connect} from 'react-redux';
import PersonItem from './PersonItem';

const mapStateToProps = ({people: {allIds}}) => ({ids: allIds});

const People = ({ids}) => (
  <>
    <NavigationBar title="People" />
    <FlatList
      data={ids}
      keyExtractor={id => id}
      contentInsetAdjustmentBehavior="automatic"
      renderItem={({item}) => <PersonItem id={item} />} />
  </>
);

export default connect(mapStateToProps)(People);
