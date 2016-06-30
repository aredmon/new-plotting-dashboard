import React, { Component, PropTypes } from 'react';
import IconMenu from 'material-ui/lib/menus/icon-menu';
import IconButton from 'material-ui/lib/icon-button';
import FontIcon from 'material-ui/lib/font-icon';
import NavigationExpandMoreIcon from 'material-ui/lib/svg-icons/navigation/expand-more';
import MenuItem from 'material-ui/lib/menus/menu-item';
import DropDownMenu from 'material-ui/lib/DropDownMenu';
import Toolbar from 'material-ui/lib/toolbar/toolbar';
import ToolbarGroup from 'material-ui/lib/toolbar/toolbar-group';
import ToolbarSeparator from 'material-ui/lib/toolbar/toolbar-separator';
import ToolbarTitle from 'material-ui/lib/toolbar/toolbar-title';
import TextField from 'material-ui/lib/text-field';
import Colors from 'material-ui/lib/styles/colors';

class FilterToolbar extends Component {

  constructor () {
    super();
    this.handleFilterTextChange = this.handleFilterTextChange.bind(this);
  }

  static propTypes = {
    searchText: PropTypes.string,
    onSearch: PropTypes.func
  };

  static defaultProps = {
    searchText: '',
    onSearch: () => null
  };

  get styles () {
    return {
      root: {
        margin: 6
      },
      errorStyle: {
        color: Colors.lightGreen600
      },
      underlineStyle: {
        borderColor: Colors.grey50
      },
      styleField: {
        marginLeft: '20'
      }
    };
  }

  handleFilterTextChange (evt) {
    const filterText = evt.target.value;
    this.props.onSearch(filterText);
  }

  render () {
    const { searchText } = this.props;
    const styles = this.styles;
    return (
      <div style={styles.root}>
        <Toolbar>
          <ToolbarGroup
            firstChild
            float='left'
            style={styles.styleField}
          >
            <TextField
              hintText='Search calls...'
              hintStyle={styles.errorStyle}
              underlineStyle={styles.underlineStyle}
              onChange={this.handleFilterTextChange}
              value={searchText}
            />
          </ToolbarGroup>
          <ToolbarGroup
            style={styles.styleField}
          >
            <ToolbarTitle text='Sort By' />
            <DropDownMenu value={1}>
              <MenuItem value={1} primaryText='Date Created' />
              <MenuItem value={2} primaryText='Call Length' />
              <MenuItem value={3} primaryText='Customer' />
            </DropDownMenu>
          </ToolbarGroup>
          <ToolbarGroup float='right'>
            <FontIcon className='muidocs-icon-custom-sort' />
            <IconMenu
              iconButtonElement={
                <IconButton touch>
                  <NavigationExpandMoreIcon />
                </IconButton>
              }
          >
              <MenuItem primaryText='Download' />
              <MenuItem primaryText='More Info' />
            </IconMenu>
            <ToolbarSeparator />
          </ToolbarGroup>
        </Toolbar>
      </div>
    );
  }

}

export default FilterToolbar;
