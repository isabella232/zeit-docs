import React from 'react'
import { useAmp } from 'next/amp'
import Page from '~/components/layout/page'
import Header from '~/components/layout/header'
import { UserContext } from '~/lib/user-context'
import { ZenContext } from '~/lib/zen-context'
import UseTeamInfo from '~/lib/use-team-info'
import { withToasts } from '~/components/toasts'
import * as bodyLocker from '~/lib/utils/body-locker'

const LayoutHeader = React.memo(props => {
  const isAmp = useAmp()
  return <Header {...props} isAmp={isAmp} />
})

class Layout extends React.Component {
  static contextType = ZenContext

  state = {
    navigationActive: false,
    zenModeActive: false,
    scrollPosition: (typeof window !== 'undefined' && window.pageYOffset) || 0,
    scrollDirection: null
  }

  altKeyDown = false

  exitZenMode = () => {
    this.setState({
      zenModeActive: false
    })
  }

  onKeyDown(event) {
    // Make Zen mode run only for Screen sizes greater than 960px
    if (window.innerWidth < 960) {
      return
    }
    switch (event.keyCode) {
      case 90:
        // Enter Zen Mode
        if (this.altKeyDown) {
          this.setState({
            zenModeActive: !this.state.zenModeActive
          })
        }
        break

      case 27:
        // Exit Zen Mode
        this.setState({
          zenModeActive: false
        })

        break

      case 18: // alt-key
        this.altKeyDown = true
        break
    }
  }

  onKeyUp(event) {
    if (event.which === 18) {
      this.altKeyDown = false
    }
    this.altKeyDown = false
  }

  onScroll() {
    requestAnimationFrame(() => {
      this.setState({
        scrollDirection:
          this.state.scrollPosition < window.pageYOffset ? 'down' : 'up',
        scrollPosition: window.pageYOffset
      })
    })
  }

  componentDidMount() {
    document.addEventListener('keydown', this.onKeyDown.bind(this), false)
    document.addEventListener('keyUp', this.onKeyUp.bind(this), false)
    window.addEventListener('scroll', this.onScroll.bind(this))
  }

  componentWillUnmount() {
    window.removeEventListener('scroll', this.onScroll.bind(this))
    document.removeEventListener('keydown', this.onKeyDown.bind(this), false)
    document.removeEventListener('keyUp', this.onKeyUp.bind(this), false)
  }

  handleToggleNavigation = () => {
    if (this.state.navigationActive === true) {
      bodyLocker.unlock()
    } else {
      bodyLocker.lock()
    }

    this.setState(({ navigationActive }) => {
      return {
        navigationActive: !navigationActive
      }
    })
  }

  handleIndexClick = () => {
    if (this.state.navigationActive) {
      this.handleToggleNavigation()
    }
  }

  render() {
    const { children, dynamicSearch, data } = this.props
    const { scrollPosition, scrollDirection } = this.state

    const hideHeader =
      scrollDirection === 'down' && scrollPosition > 0 ? true : false
    const detached = scrollPosition > 0

    return (
      <Page>
        <UserContext.Consumer>
          {({ user, userLoaded }) => (
            <UseTeamInfo
              user={user}
              render={({ teams }) => (
                <LayoutHeader
                  hideHeader={hideHeader}
                  detached={detached}
                  inHero={scrollPosition < 334}
                  isTop={scrollPosition <= 0}
                  hideHeaderSearch={dynamicSearch && scrollPosition < 334}
                  dynamicSearch={dynamicSearch}
                  onToggleNavigation={this.handleToggleNavigation}
                  user={user}
                  teams={teams}
                  userLoaded={userLoaded}
                  navigationActive={this.state.navigationActive}
                  handleIndexClick={this.handleIndexClick}
                  zenModeActive={this.state.zenModeActive}
                  exitZenMode={this.exitZenMode}
                  data={data}
                />
              )}
            />
          )}
        </UserContext.Consumer>
        <ZenContext.Provider value={this.state.zenModeActive}>
          {children}
        </ZenContext.Provider>
      </Page>
    )
  }
}

export default withToasts(Layout)
