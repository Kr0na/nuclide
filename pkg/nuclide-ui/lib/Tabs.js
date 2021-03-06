'use babel';
/* @flow */

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

import {React} from 'react-for-atom';
import classnames from 'classnames';

export const Tabs = React.createClass({

  propTypes: {
    tabs: React.PropTypes.arrayOf(React.PropTypes.shape({
      name: React.PropTypes.string.isRequired,
      tabContent: React.PropTypes.node.isRequired,
    })).isRequired,
    activeTabName: React.PropTypes.string.isRequired,
    onActiveTabChange: React.PropTypes.func.isRequired,
    triggeringEvent: React.PropTypes.string.isRequired,
  },

  getDefaultProps(): any {
    return {
      triggeringEvent: 'onClick',
    };
  },

  _handleTabChange(selectedTabName: string) {
    if (typeof this.props.onActiveTabChange === 'function') {
      this.props.onActiveTabChange(
        this.props.tabs.find(tab => tab.name === selectedTabName)
      );
    }
  },

  _renderTabMenu(): React.Element<any> {
    const tabs = this.props.tabs.map(tab => {
      const handler = {};
      handler[this.props.triggeringEvent] = this._handleTabChange.bind(this, tab.name);
      return (
        <li
          className={classnames({
            tab: true,
            active: this.props.activeTabName === tab.name,
          })}
          key={tab.name}
          {...handler}>
          <div className="title">
            {tab.tabContent}
          </div>
        </li>
      );
    });
    return (
      <ul className="tab-bar list-inline inset-panel">
        {tabs}
      </ul>
    );
  },

  render(): React.Element<any> {
    return (
      <div className="nuclide-tabs">
        {this._renderTabMenu()}
      </div>
    );
  },
});
