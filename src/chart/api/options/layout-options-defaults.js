import { defaultFontFamily } from '../../helpers/make-font';
export const layoutOptionsDefaults = {
    background: {
        type: "solid" /* ColorType.Solid */,
        color: '#FFFFFF',
    },
    textColor: '#191919',
    fontSize: 12,
    fontFamily: defaultFontFamily,
    panes: {
        enableResize: true,
        separatorColor: '#E0E3EB',
        separatorHoverColor: 'rgba(178, 181, 189, 0.2)',
    },
    attributionLogo: true,
    colorSpace: 'srgb',
    colorParsers: [],
};
