'use babel';
/* @flow */

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

import type {Source} from '../types';

import classnames from 'classnames';
import {React} from 'react-for-atom';
import {AtomInput} from '../../../nuclide-ui/lib/AtomInput';
import {ButtonGroup} from '../../../nuclide-ui/lib/ButtonGroup';
import {FunnelIcon} from './FunnelIcon';
import {ModalMultiSelect} from '../../../nuclide-ui/lib/ModalMultiSelect';
import {Toolbar} from '../../../nuclide-ui/lib/Toolbar';
import {ToolbarLeft} from '../../../nuclide-ui/lib/ToolbarLeft';
import {ToolbarRight} from '../../../nuclide-ui/lib/ToolbarRight';
import {
  Button,
  ButtonSizes,
} from '../../../nuclide-ui/lib/Button';
import invariant from 'assert';

type Props = {
  clear: () => void;
  invalidFilterInput: boolean;
  enableRegExpFilter: boolean;
  selectedSourceIds: Array<string>;
  sources: Array<Source>;
  onFilterTextChange: (filterText: string) => void;
  toggleRegExpFilter: () => void;
  onSelectedSourcesChange: (sourceIds: Array<string>) => void;
};

export default class ConsoleHeader extends React.Component {
  props: Props;

  constructor(props: Props) {
    super(props);
    (this: any)._handleClearButtonClick = this._handleClearButtonClick.bind(this);
    (this: any)._handleReToggleButtonClick = this._handleReToggleButtonClick.bind(this);
    (this: any)._handleSelectedSourcesChange = this._handleSelectedSourcesChange.bind(this);
    (this: any)._renderOption = this._renderOption.bind(this);
  }

  _handleClearButtonClick(event: SyntheticMouseEvent): void {
    this.props.clear();
  }

  _handleReToggleButtonClick(): void {
    this.props.toggleRegExpFilter();
  }

  _handleSelectedSourcesChange(sourceIds: Array<any>): void {
    this.props.onSelectedSourcesChange(
      sourceIds.length === 0
        // We don't actually allow no sources to be selected. What would be the point? If nothing is
        // selected, treat it as though everything is.
        ? this.props.sources.map(source => source.id)
        : sourceIds
    );
  }

  _renderProcessControlButton(source: Source): ?React.Element<any> {
    let action;
    let label;
    let icon;
    switch (source.status) {
      case 'running': {
        action = source.stop;
        label = 'Stop Process';
        icon = 'primitive-square';
        break;
      }
      case 'stopped': {
        action = source.start;
        label = 'Start Process';
        icon = 'triangle-right';
        break;
      }
    }
    if (action == null) { return; }
    const clickHandler = event => {
      event.stopPropagation();
      invariant(action != null);
      action();
    };
    return (
      <Button
        className="pull-right"
        icon={icon}
        onClick={clickHandler}>
        {label}
      </Button>
    );
  }

  _renderOption(optionProps: {option: {label: string; value: string}}): React.Element<any> {
    const {option} = optionProps;
    const source = this.props.sources.find(s => s.id === option.value);
    invariant(source != null);
    return (
      <span>
        {option.label}
        {this._renderProcessControlButton(source)}
      </span>
    );
  }

  render(): ?React.Element<any> {
    const options = this.props.sources
      .slice()
      .sort((a, b) => sortAlpha(a.name, b.name))
      .map(source => ({
        label: source.id,
        value: source.name,
      }));

    const filterInputClassName = classnames('nuclide-console-filter-field', {
      invalid: this.props.invalidFilterInput,
    });

    const MultiSelectOption = this._renderOption;

    return (
      <Toolbar location="top">
        <ToolbarLeft>
          <span className="nuclide-console-header-filter-icon inline-block">
            <FunnelIcon />
          </span>
          <ModalMultiSelect
            labelComponent={MultiSelectLabel}
            optionComponent={MultiSelectOption}
            size={ButtonSizes.SMALL}
            options={options}
            value={this.props.selectedSourceIds}
            onChange={this._handleSelectedSourcesChange}
            className="inline-block"
          />
          <ButtonGroup className="inline-block">
            <AtomInput
              className={filterInputClassName}
              size="sm"
              width={200}
              placeholderText="Filter"
              onDidChange={this.props.onFilterTextChange}
            />
            <Button
              className="nuclide-console-filter-regexp-button"
              size={ButtonSizes.SMALL}
              selected={this.props.enableRegExpFilter}
              onClick={this._handleReToggleButtonClick}>
              .*
            </Button>
          </ButtonGroup>
        </ToolbarLeft>
        <ToolbarRight>
          <Button
            size={ButtonSizes.SMALL}
            onClick={this._handleClearButtonClick}>
            Clear
          </Button>
        </ToolbarRight>
      </Toolbar>
    );
  }

}

function sortAlpha(a: string, b: string): number {
  const aLower = a.toLowerCase();
  const bLower = b.toLowerCase();
  if (aLower < bLower) {
    return -1;
  } else if (aLower > bLower) {
    return 1;
  }
  return 0;
}

type LabelProps = {
  selectedOptions: Array<{value: string; label: string}>;
};

function MultiSelectLabel(props: LabelProps): React.Element<any> {
  const {selectedOptions} = props;
  const label = selectedOptions.length === 1
    ? selectedOptions[0].label
    : `${selectedOptions.length} Sources`;
  return <span>Showing: {label}</span>;
}
