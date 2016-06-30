import React, { PropTypes } from 'react';
import { routeActions } from 'react-router-redux';
import { connect } from 'react-redux';
import AppBar from 'material-ui/lib/app-bar';
import { Spacing, Colors } from 'material-ui/lib/styles';
import ThemeManager from 'material-ui/lib/styles/theme-manager';
import Theme from '../../helpers/theme';
import withViewport from '../../helpers/withViewport';
import AppLeftNav from './AppLeftNav';
import '../../styles/core.scss';

const mapDispatchToProps = (dispatch) => {
  return {
    dispatch
  };
};

export class CoreLayout extends React.Component {

  constructor () {
    super();
    this.state = {
      muiTheme: ThemeManager.getMuiTheme(Theme),
      leftNavOpen: false
    };
    this.handleTouchTapLeftIconButton = this.handleTouchTapLeftIconButton.bind(this);
    this.handleChangeRequestLeftNav = this.handleChangeRequestLeftNav.bind(this);
    this.handleRequestChangeList = this.handleRequestChangeList.bind(this);
  }

  static propTypes = {
    viewport: PropTypes.object,
    history: PropTypes.object.isRequired,
    location: PropTypes.object.isRequired,
    children: PropTypes.element,
    dispatch: PropTypes.func
  };

  static contextTypes = {
    router: React.PropTypes.object
  };

  static childContextTypes = {
    muiTheme: PropTypes.object
  };

  static defaultProps = {
    viewport: {}
  };

  getChildContext () {
    return {
      muiTheme: this.state.muiTheme
    };
  }

  get styles () {
    const darkWhite = Colors.darkWhite;
    const { width } = this.props.viewport;

    const styles = {
      appBar: {
        position: 'fixed',
        // Needed to overlap the examples
        zIndex: this.state.muiTheme.zIndex.appBar + 1,
        top: 0,
        fontFamily: Theme.fontFamily
      },
      root: {
        paddingTop: Spacing.desktopKeylineIncrement,
        minHeight: '100vh',
        backgroundColor: '#efefef',
        overflow: 'hidden'
      },
      content: {
        margin: Spacing.desktopGutter / 2
      },
      contentWhenMedium: {
        margin: Spacing.desktopGutter / 2
      },
      footer: {
        backgroundColor: Colors.grey900,
        textAlign: 'center'
      },
      a: {
        color: darkWhite
      },
      p: {
        margin: '0 auto',
        padding: 0,
        color: Colors.lightWhite,
        maxWidth: 335
      },
      iconButton: {
        color: darkWhite
      }
    };

    if (width < 768) {
      styles.content = Object.assign(styles.content, styles.contentWhenMedium);
    }

    return styles;
  }

  handleTouchTapLeftIconButton () {
    const { router } = this.context;
    const {
      dispatch
    } = this.props;
    this.setState({
      leftNavOpen: !this.state.leftNavOpen
    });
    dispatch(routeActions.push('/'));
    if (router) {
      // router.push('/');
    }
  }

  handleChangeMuiTheme (muiTheme) {
    this.setState({
      muiTheme: muiTheme
    });
  }

  handleChangeRequestLeftNav (open) {
    this.setState({
      leftNavOpen: open
    });
  }

  handleRequestChangeList (event, value) {
    const {
      dispatch
    } = this.props;
    dispatch(routeActions.push(value));
    this.setState({
      leftNavOpen: false
    });
  }

  render () {
    const {
      history,
      location,
      children,
      viewport
    } = this.props;

    const {
      router
    } = this.context;

    const { width } = viewport;

    let {
      leftNavOpen
    } = this.state;

    const {
      prepareStyles
    } = this.state.muiTheme;

    const styles = this.styles;
    let title;
    if (router) {
      title = router.isActive('/plot:plotType') ? 'Plots'
        : Theme.appName;
    }

    let docked = false;
    let showMenuIconButton = true;

    if (width >= 992 && title !== '') {
      docked = true;
      leftNavOpen = true;
      showMenuIconButton = false;

      styles.leftNav = {
        zIndex: styles.appBar.zIndex - 1
      };
      styles.appBar.marginLeft = 256;
      styles.root.paddingLeft = 256;
      styles.footer.paddingLeft = 256;
    }
    return (
      <div>
        <AppBar
          onLeftIconButtonTouchTap={this.handleTouchTapLeftIconButton}
          title={title}
          zDepth={0}
          style={styles.appBar}
          showMenuIconButton={showMenuIconButton}
        />
        {title !== ''
          ? (
          <div style={prepareStyles(styles.root)}>
            <div style={prepareStyles(styles.content)}>
              {React.cloneElement(children, {
                onChangeMuiTheme: this.handleChangeMuiTheme
              })}
            </div>
          </div>
          )
          : children
        }
        <AppLeftNav
          style={styles.leftNav}
          history={history}
          location={location}
          docked={docked}
          onRequestChangeLeftNav={this.handleChangeRequestLeftNav}
          onRequestChangeList={this.handleRequestChangeList}
          open={leftNavOpen}
        />
      </div>
    );
  }

}

export const CoreLayoutContainer = withViewport(connect(
  mapDispatchToProps
)(CoreLayout));

export default CoreLayoutContainer;
