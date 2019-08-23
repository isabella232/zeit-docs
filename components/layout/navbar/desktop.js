import React, { useState, useEffect } from 'react'
import cn from 'classnames'
import { LinkWithHoverPrefetch } from '~/components/text/link'
import qs from 'querystring'
import { parse } from 'url'
import _scrollIntoViewIfNeeded from 'scroll-into-view-if-needed'
import ArrowRight from '~/components/icons/arrow-right'
import * as metrics from '~/lib/metrics'

function scrollIntoViewIfNeeded(elem, centerIfNeeded, options, config) {
  const finalElement = findClosestScrollableElement(elem)
  return _scrollIntoViewIfNeeded(
    elem,
    centerIfNeeded,
    options,
    finalElement,
    config
  )
}

function findClosestScrollableElement(_elem) {
  const { parentNode } = _elem
  if (!parentNode) return null

  if (
    parentNode.scrollHeight > parentNode.clientHeight ||
    parentNode.scrollWidth > parentNode.clientWidth
  ) {
    return parentNode
  } else {
    return findClosestScrollableElement(parentNode)
  }
}

function Category({ info, level = 1, onClick, ...props }) {
  const levelClass = `level-${level}`
  const [toggle, setToggle] = useState(false)

  const categorySelected =
    props.url.pathname === '/docs' || props.url.pathname === '/docs/v2'
      ? info.name === 'Getting Started'
        ? true
        : false
      : JSON.stringify(info.posts).includes(
          props.url.pathname.replace(/\/$/, '')
        )

  useEffect(() => {
    if (categorySelected) {
      setToggle(true)
    }
  }, [categorySelected])

  const onToggleCategory = () => {
    metrics.event({
      action: 'sidebar_category_toggled',
      category: 'engagement',
      label: info.name
    })
    setToggle(!toggle)
  }

  return (
    <div
      className={cn('category', levelClass, {
        open: toggle,
        selected: categorySelected,
        separated: info.sidebarSeparator
      })}
      key={info.name || ''}
    >
      <a className="label" onClick={onToggleCategory}>
        <ArrowRight fill="#999" />
        {info.name}
      </a>
      {!info.href ? (
        <div className="posts">
          {info.posts.map(postInfo => (
            <Post
              info={postInfo}
              level={level + 1}
              categorySelected={categorySelected}
              key={postInfo.name}
              onClick={onClick}
              {...props}
            />
          ))}
        </div>
      ) : null}
      <style jsx>{`
        .label {
          font-size: var(--font-size-primary);
          line-height: var(--line-height-primary);
          font-weight: 400;
          cursor: pointer;
          display: flex;
          align-items: center;
          color: var(--accents-6);
        }

        .label :global(svg) {
          margin-right: 14px;
          transition: all 0.15s ease;
        }

        .selected > .label {
          font-weight: 600;
          color: #000;
        }

        .open > .label {
          color: #000;
        }

        .open > .label :global(svg) {
          margin-left: 1px;
          margin-right: 13px;
          transform: rotate(90deg);
        }

        .level-2 .label {
          font-size: var(--font-size-primary);
          line-height: var(--line-height-primary);
          text-transform: none;
          letter-spacing: 0;
          cursor: default;
        }

        .label:hover {
          color: #000;
        }

        .category {
          margin: 18px 0;
        }

        .category:last-child {
          margin-bottom: 0;
        }

        .separated {
          margin-bottom: 32px;
        }

        .posts {
          border-left: 1px solid #eaeaea;
          margin-top: 0;
          height: 0;
          overflow: hidden;
          padding-left: 19px;
          margin-left: 4px;
        }

        .open > .posts {
          margin-top: 18px;
          height: auto;
        }

        @media screen and (max-width: 950px) {
          .category {
            margin: 24px 0;
          }
        }
      `}</style>
    </div>
  )
}

function Post({ info, level = 1, onClick, ...props }) {
  const levelClass = `level-${level}`

  if (info.posts) {
    return <Category info={info} level={level} {...props} />
  }

  return (
    <div
      key={info.href}
      className={cn('link', levelClass, { separated: info.sidebarSeparator })}
    >
      <NavLink
        info={info}
        url={props.url}
        hash={props.hash}
        scrollSelectedIntoView={props.scrollSelectedIntoView}
        categorySelected={props.categorySelected}
        level={level}
        onClick={onClick}
      />
      <style jsx>{`
        .link {
          margin: 18px 0;
          display: flex;
          align-items: center;
        }

        .link::before {
          content: '';
          flex-basis: 4px;
          flex-shrink: 0;
          display: block;
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: var(--accents-5);
          margin-right: 16px;
        }

        .link:first-child {
          margin-top: 0;
        }

        .link:last-child {
          margin-bottom: 0;
        }

        .separated {
          margin-bottom: 32px;
        }

        @media screen and (max-width: 950px) {
          .link {
            margin: 24px 0;
          }
        }
      `}</style>
    </div>
  )
}

export class NavLink extends React.Component {
  constructor(props) {
    super(props)
    this.node = null
    this.state = { selected: this.isSelected() }
  }

  componentDidMount() {
    this.scrollIntoViewIfNeeded()
  }

  shouldComponentUpdate(nextProps, nextState) {
    return this.state.selected !== nextState.selected
  }

  componentDidUpdate() {
    this.scrollIntoViewIfNeeded()
  }

  getCurrentHref(props = this.props) {
    const { url, hash } = props
    const cleanedQuery = { ...url.query }
    delete cleanedQuery.amp
    const query = qs.stringify(cleanedQuery)
    return `${url.pathname}${query ? '?' + query : ''}${hash || ''}`
  }

  isSelected(props = this.props) {
    const { href, aliases = [], posts } = props.info
    const currentHref = this.getCurrentHref(props)

    if (href === currentHref) return true
    if (href === props.url.pathname) return true
    if (href.includes('#')) {
      if (posts && posts.length && currentHref === href) return true
      if (
        posts &&
        posts.length &&
        props.level > 2 &&
        (currentHref === href || currentHref.startsWith(href))
      )
        return true
      if ((!posts || !posts.length) && currentHref.startsWith(href)) return true
    }
    if (aliases.indexOf(currentHref) >= 0) return true

    return false
  }

  onlyHashChange() {
    const { pathname } = parse(this.props.info.href)
    return pathname === this.props.url.pathname
  }

  scrollIntoViewIfNeeded() {
    if (
      this.props.scrollSelectedIntoView &&
      this.state.selected &&
      this.props.categorySelected
    ) {
      if (this.node.scrollIntoViewIfNeeded) {
        this.node.scrollIntoViewIfNeeded()
      } else {
        scrollIntoViewIfNeeded(this.node)
      }
    }
  }

  render() {
    const { info, onClick } = this.props
    const { selected } = this.state

    return (
      <div
        ref={ref => (this.node = ref)}
        className={cn('nav-link', { selected })}
      >
        {// NOTE: use just anchor element for triggering `hashchange` event
        this.onlyHashChange() ? (
          <a className={selected ? 'selected' : ''} href={info.as || info.href}>
            {info.name}
          </a>
        ) : (
          <LinkWithHoverPrefetch
            href={info.href}
            as={info.as || info.href}
            onClick={onClick}
          >
            {info.name}
          </LinkWithHoverPrefetch>
        )}
        <style jsx>{`
          div.selected {
            box-sizing: border-box;
          }

          .nav-link {
            display: flex;
          }

          .nav-link :global(a) {
            text-decoration: none;
            font-size: var(--font-size-primary);
            line-height: var(--line-height-primary);
            color: var(--accents-6);
            box-sizing: border-box;
          }

          .selected :global(a) {
            font-weight: 600;
            color: #000;
          }

          .nav-link:hover :global(a) {
            color: #000;
          }

          span {
            color: #979797;
          }

          @media screen and (max-width: 950px) {
            div {
              padding-top: 0;
              padding-left: 0;
              padding-bottom: 0;
            }

            div.selected {
              border-left: none;
              padding-left: 0;
            }

            .nav-link :global(a) {
              display: flex;
              align-items: center;
            }
          }
        `}</style>
      </div>
    )
  }
}

export default function DocsNavbarDesktop({
  data = [],
  handleIndexClick,
  ...props
}) {
  return (
    <>
      {data.map(categoryInfo =>
        categoryInfo.posts ? (
          <Category
            info={categoryInfo}
            {...props}
            key={categoryInfo.name}
            onClick={handleIndexClick}
          />
        ) : (
          <Post
            info={categoryInfo}
            level={1}
            key={categoryInfo.name}
            onClick={handleIndexClick}
            {...props}
          />
        )
      )}
    </>
  )
}
