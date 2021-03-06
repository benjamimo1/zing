/*
 * Copyright (C) Pootle contributors.
 * Copyright (C) Zing contributors.
 *
 * This file is a part of the Zing project. It is distributed under the GPL3
 * or later license. See the LICENSE file for a copy of the license and the
 * AUTHORS file for copyright and authorship information.
 */

import React from 'react';

import ReactRenderer from 'utils/ReactRenderer';
import { q, qAll } from 'utils/dom';

import EditorContainer from './containers/EditorContainer';
import UnitSource from './components/UnitSource';
import { hasCRLF, normalize, denormalize } from './utils/normalizer';
import { insertAtCaret, setValue } from './utils/RawFontAware';

const ReactEditor = {
  init(props) {
    this.node = q('.js-mount-editor');
    this.sourceNode = q('.js-mount-editor-original-src');
    this.alternativeSourceNodes = qAll('.js-mount-editor-alt-src');
    this.props = {};
    this.hasCRLF = props.sourceValues.some(hasCRLF);

    ReactRenderer.unmountComponents();

    this.setProps(props);
  },

  setProps(props) {
    this.props = Object.assign(this.props, props);

    /*           ,
     *  __  _.-"` `'-.
     * /||\'._ __{}_(  CUSTOMS CHECK: we convert potential CRLFs to LFs
     * ||||  |'--.__\  when passing values down to components (`extraProps`),
     * |  L.(   ^_\^   but we keep the original values in `this.props`
     * \ .-' |   _ |   just in case the outside world needs to query them.
     * | |   )\___/
     * |  \-'`:._]
     * \__/;      '-.
     */
    const extraProps = {};
    if (this.hasCRLF && props.hasOwnProperty('initialValues')) {
      extraProps.initialValues = normalize(props.initialValues);
    }

    this.editorInstance = ReactRenderer.render(
      <EditorContainer
        onChange={this.handleChange}
        {...this.props}
        {...extraProps}
      />,
      this.node
    );
    ReactRenderer.render(
      <UnitSource
        canEdit={this.props.canSuggest || this.props.canTranslate}
        id={this.props.unitId}
        values={this.props.sourceValues}
        hasPlurals={this.props.hasPlurals}
        sourceLocaleCode={this.props.sourceLocaleCode}
        sourceLocaleDir={this.props.sourceLocaleDir}
      />,
      this.sourceNode
    );
    for (let i = 0; i < this.alternativeSourceNodes.length; i++) {
      const mountNode = this.alternativeSourceNodes[i];
      const unit = this.props.alternativeSources[mountNode.dataset.id];
      ReactRenderer.render(
        <UnitSource
          canEdit={this.props.canSuggest || this.props.canTranslate}
          id={unit.id}
          values={unit.target}
          hasPlurals={unit.has_plurals}
          sourceLocaleCode={unit.language_code}
          sourceLocaleDir={unit.language_direction}
        />,
        this.alternativeSourceNodes[i]
      );
    }
  },

  // FIXME: this additional layer of state tracking is only kept to allow
  // interaction from the outside world. Remove ASAP.
  get stateValues() {
    const stateValues = this.editorInstance.getStateValues();
    /*           ,
     *  __  _.-"` `'-.
     * /||\'._ __{}_(  CUSTOMS CHECK: if any CRLF => LF conversion was done
     * ||||  |'--.__\  when passing values down (`this.hasCRLF`), we need to
     * |  L.(   ^_\^   convert values back to their original form (LF => CRLF)
     * \ .-' |   _ |   when providing the hook to the outside world, making
     * | |   )\___/    them unaware of what happened within the component's
     * |  \-'`:._]     ecosystem.
     * \__/;      '-.
     */
    if (this.hasCRLF) {
      return denormalize(stateValues);
    }
    return stateValues;
  },

  handleChange() {
    PTL.editor.onTextareaChange();
  },

  // FIXME: the following are ad-hoc methods for "communication". We should
  // rather drill holes in some other way, e.g. using Redux.

  /**
   * Sets a new textarea value.
   */
  setValueFor(indexOrElement, value) {
    const textareas = this.editorInstance.getAreas();
    const index =
      typeof indexOrElement === 'object'
        ? textareas.indexOf(indexOrElement)
        : indexOrElement;
    setValue(textareas[index], value, {
      isRawMode: this.props.isRawMode,
      triggerChange: true,
    });
    textareas[index].focus();
  },

  /**
   * Inserts a value in the current caret position.
   */
  insertAtCaretFor(indexOrElement, value) {
    const textareas = this.editorInstance.getAreas();
    const index =
      typeof indexOrElement === 'object'
        ? textareas.indexOf(indexOrElement)
        : indexOrElement;
    insertAtCaret(textareas[index], value, {
      isRawMode: this.props.isRawMode,
      triggerChange: true,
    });
    textareas[index].focus();
  },
};

export default ReactEditor;
