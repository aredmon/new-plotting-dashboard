import React, { PropTypes } from 'react';
import List from 'material-ui/lib/lists/list';
import {SelectableContainerEnhance} from 'material-ui/lib/hoc/selectable-enhance';

// Mutliselect higher order component
let SelectableList = SelectableContainerEnhance(List);

function wrapState (ComposedComponent) {
  class StateWrapper extends React.Component {
    constructor () {
      super();
      this.handleUpdateSelectedIndex = this.handleUpdateSelectedIndex.bind(this);
    }
    static propTypes = {
      onChange: PropTypes.func.isRequired,
      selectedIndex: PropTypes.number
    }

    handleUpdateSelectedIndex (e, index) {
      this.props.onChange(index);
    }

    render () {
      return (
        <ComposedComponent
          {...this.props}
          {...this.state}
          valueLink={{
            value: this.props.selectedIndex,
            requestChange: this.handleUpdateSelectedIndex}}
        />
      );
    }
  }
  return StateWrapper;
}
SelectableList = wrapState(SelectableList);

export default SelectableList;
