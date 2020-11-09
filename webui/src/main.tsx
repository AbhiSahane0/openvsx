/********************************************************************************
 * Copyright (c) 2019 TypeFox and others
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * SPDX-License-Identifier: EPL-2.0
 ********************************************************************************/

import * as React from 'react';
import { Container, AppBar, Toolbar, Typography, IconButton, CssBaseline, Box, Theme } from '@material-ui/core';
import { WithStyles, createStyles, withStyles } from '@material-ui/styles';
import AccountBoxIcon from '@material-ui/icons/AccountBox';
import BrokenImageIcon from '@material-ui/icons/BrokenImage';
import { Route, Switch } from 'react-router-dom';
import { ExtensionListContainer, ExtensionListRoutes } from './pages/extension-list/extension-list-container';
import { UserSettings, UserSettingsRoutes } from './pages/user/user-settings';
import { ExtensionDetailRoutes, ExtensionDetail } from './pages/extension-detail/extension-detail';
import { UserAvatar } from './pages/user/avatar';
import { ExtensionRegistryService } from './extension-registry-service';
import { UserData, isError } from './extension-registry-types';
import { MainContext } from './context';
import { PageSettings } from './page-settings';
import { handleError } from './utils';
import { ErrorDialog } from './components/error-dialog';
import '../src/main.css';
import { HeaderMenu } from './header-menu';
import { AdminDashboard, AdminDashboardRoutes } from './pages/admin-dashboard/admin-dashboard';
import { ErrorResponse } from './server-request';
import { Banner } from './components/banner';

const mainStyles = (theme: Theme) => createStyles({
    main: {
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        minHeight: '100vh'
    },
    link: {
        textDecoration: 'none',
        color: theme.palette.text.primary
    },
    spreadHorizontally: {
        justifyContent: 'space-between'
    },
    alignVertically: {
        display: 'flex',
        alignItems: 'center'
    },
    footer: {
        position: 'fixed',
        bottom: 0,
        width: '100%',
        padding: `${theme.spacing(1)}px ${theme.spacing(2)}px`,
        backgroundColor: theme.palette.background.paper,
        boxShadow: '0px -2px 6px 0px rgba(0, 0, 0, 0.5)'
    },
    banner: {
        background: theme.palette.secondary.dark
    }
});

class MainComponent extends React.Component<MainComponent.Props, MainComponent.State> {

    constructor(props: MainComponent.Props) {
        super(props);

        this.state = {
            userLoading: true,
            error: '',
            isErrorDialogOpen: false,
            isFooterExpanded: false,
            isBannerOpen: false
        };
    }

    protected onDismissBannerButtonClick = () => {
        const onClose = this.props.pageSettings.elements.banner?.props.onClose;
        if (onClose) {
            onClose();
        }
        const cookie = this.props.pageSettings.elements.banner?.props.cookieOnClose;
        if (cookie) {
            document.cookie = `${cookie.key}=${cookie.value}`;
        }
        this.setState({ isBannerOpen: false });
    };

    componentDidMount(): void {
        const searchParams = new URLSearchParams(window.location.search);
        if (searchParams.has('auth-error')) {
            this.props.service.getUserAuthError()
                .then(err => this.handleError(err));
        }
        this.updateUser();
        const cookie = this.props.pageSettings.elements.banner?.props.cookieOnClose;
        let open = true;
        if (cookie) {
            const decodedCookieString = decodeURIComponent(document.cookie);
            const cookies = decodedCookieString.split(';');
            const bannerClosedCookie = cookies.find(c => c.startsWith(cookie.key));
            if (bannerClosedCookie) {
                open = false;
            }
        }
        this.setState({ isBannerOpen: open });
    }

    protected async updateUser() {
        try {
            const user = await this.props.service.getUser();
            if (isError(user)) {
                this.setState({ user: undefined, userLoading: false });
            } else {
                this.setState({ user, userLoading: false });
            }
        } catch (err) {
            this.setState({ error: handleError(err), isErrorDialogOpen: true, userLoading: false });
        }
    }

    handleError = (err: Error | Partial<ErrorResponse>) => {
        const error = handleError(err);
        this.setState({ error, isErrorDialogOpen: true });
    };

    handleDialogClose = () => {
        this.setState({ isErrorDialogOpen: false });
    };

    render(): React.ReactNode {
        const mainContext: MainContext = {
            service: this.props.service,
            pageSettings: this.props.pageSettings,
            user: this.state.user,
            handleError: this.handleError.bind(this)
        };
        return <React.Fragment>
            <CssBaseline />
            <MainContext.Provider value={mainContext}>
                {this.renderPageContent()}
            </MainContext.Provider>
        </React.Fragment>;
    }

    protected renderPageContent(): React.ReactNode {
        const {
            toolbarContent: ToolbarContent,
            footer: FooterComponent,
            additionalRoutes: AdditionalRoutes,
            banner: BannerComponent
        } = this.props.pageSettings.elements;
        const classes = this.props.classes;
        return <React.Fragment>
            <Switch>
                <Route path={AdminDashboardRoutes.MAIN}>
                    <AdminDashboard></AdminDashboard>
                </Route>
                <Route path='*'>
                    <Box className={classes.main}>
                        <AppBar position='relative'>
                            <Toolbar classes={{ root: classes.spreadHorizontally }}>
                                <Box className={classes.alignVertically}>
                                    {ToolbarContent ? <ToolbarContent /> : null}
                                </Box>
                                <Box className={classes.alignVertically}>
                                    <HeaderMenu />
                                    {
                                        this.state.user ?
                                            <UserAvatar />
                                            :
                                            <IconButton
                                                href={this.props.service.getLoginUrl()}
                                                title='Log In'
                                                aria-label='Log In' >
                                                <AccountBoxIcon />
                                            </IconButton>
                                    }
                                </Box>
                            </Toolbar>
                        </AppBar>
                        {
                            BannerComponent ?
                                <Banner
                                    open={this.state.isBannerOpen}
                                    showDismissButton={this.props.pageSettings.elements.banner?.props.dismissButton?.show}
                                    dismissButtonLabel={this.props.pageSettings.elements.banner?.props.dismissButton?.label}
                                    dismissButtonOnClick={this.onDismissBannerButtonClick}
                                >
                                    {<BannerComponent.content />}
                                </Banner>
                                : null
                        }
                        <Box pb={`${this.getContentPadding()}px`}>
                            <Switch>
                                <Route exact path={[ExtensionListRoutes.MAIN]}
                                    render={routeProps =>
                                        <ExtensionListContainer
                                            {...routeProps}
                                        />
                                    } />
                                <Route path={UserSettingsRoutes.MAIN}
                                    render={routeProps =>
                                        <UserSettings
                                            {...routeProps}
                                            userLoading={this.state.userLoading}
                                        />
                                    } />
                                <Route path={ExtensionDetailRoutes.MAIN}
                                    render={routeProps =>
                                        <ExtensionDetail
                                            {...routeProps}
                                        />
                                    } />
                                {AdditionalRoutes ? <AdditionalRoutes /> : null}
                                <Route path='*'>
                                    <Container>
                                        <Box height='30vh' display='flex' flexWrap='wrap' justifyContent='center' alignItems='center'>
                                            <Typography variant='h3'>Oooups...this is a 404 page.</Typography>
                                            <BrokenImageIcon style={{ fontSize: '4rem', flexBasis: '100%' }} />
                                        </Box>
                                    </Container>
                                </Route>
                            </Switch>
                        </Box>
                        {
                            FooterComponent ?
                                <footer
                                    className={classes.footer}
                                    onMouseEnter={() => this.setState({ isFooterExpanded: true })}
                                    onMouseLeave={() => this.setState({ isFooterExpanded: false })} >
                                    <FooterComponent.content expanded={this.state.isFooterExpanded} />
                                </footer>
                                : null
                        }
                    </Box>
                </Route>
            </Switch>
            {
                this.state.error ?
                    <ErrorDialog
                        errorMessage={this.state.error}
                        isErrorDialogOpen={this.state.isErrorDialogOpen}
                        handleCloseDialog={this.handleDialogClose} />
                    : null
            }
        </React.Fragment>;
    }

    protected getContentPadding(): number {
        const footerHeight = this.props.pageSettings.elements.footer?.props.footerHeight;
        return footerHeight ? footerHeight + 24 : 0;
    }

}

export namespace MainComponent {
    export interface Props extends WithStyles<typeof mainStyles> {
        service: ExtensionRegistryService;
        pageSettings: PageSettings;
    }

    export interface State {
        user?: UserData;
        userLoading: boolean;
        error: string;
        isErrorDialogOpen: boolean;
        isFooterExpanded: boolean;
        isBannerOpen: boolean;
    }
}
export const Main = withStyles(mainStyles)(MainComponent);
