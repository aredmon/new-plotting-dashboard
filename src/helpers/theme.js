import Colors from 'material-ui/lib/styles/colors';
import ColorManipulator from 'material-ui/lib/utils/color-manipulator';
import Spacing from 'material-ui/lib/styles/spacing';
import zIndex from 'material-ui/lib/styles/zIndex';

export default {
  spacing: Spacing,
  zIndex: zIndex,
  fontFamily: 'Roboto, sans-serif',
  palette: {
    primary1Color: '#000',
    primary2Color: Colors.grey800,
    primary3Color: Colors.grey800,
    accent1Color: '#4cb8e9',
    accent2Color: Colors.grey100,
    accent3Color: Colors.grey500,
    textColor: Colors.grey900,
    alternateTextColor: Colors.grey500,
    canvasColor: Colors.white,
    borderColor: Colors.grey300,
    disabledColor: ColorManipulator.fade(Colors.darkBlack, 0.3),
    pickerHeaderColor: '#4CB8E9',
    truth: '#1565C0',
    track: '#64B5F6'
  },
  companyName: 'Archarithms, Inc',
  appName: 'Radar Analysis Suite'
};
