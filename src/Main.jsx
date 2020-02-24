import React, { Component } from 'react';
import PropTypes from 'prop-types';
import interact from 'interactjs';

import connectToDatoCms from './connectToDatoCms';
import './style.css';

@connectToDatoCms(plugin => ({
  token: plugin.parameters.global.datoCmsApiToken,
  itemId: plugin.itemId,
  fieldPath: plugin.fieldPath,
  apiKey: plugin.parameters.instance.apiKey,
  itemType: plugin.itemType,
  getFieldValue: plugin.getFieldValue,
  setFieldValue: plugin.setFieldValue,
  editItem: plugin.editItem,
  createNewItem: plugin.createNewItem,
  field: plugin.field,
  itemTypes: plugin.itemTypes,
}))
export default class Main extends Component {
  static propTypes = {
    itemId: PropTypes.string,
    token: PropTypes.string,
    fieldPath: PropTypes.string,
    apiKey: PropTypes.string,
    itemType: PropTypes.object,
    getFieldValue: PropTypes.func,
    setFieldValue: PropTypes.func,
    editItem: PropTypes.func,
    createNewItem: PropTypes.func,
    field: PropTypes.object,
  };

  state = {
    loading: true,
    data: {},
    values: [],
  };

  componentDidMount() {
    this.updateData();
  }

  updateData() {
    const {
      token,
      itemId,
      fieldPath,
      apiKey,
      itemType,
      getFieldValue,
    } = this.props;
    const { data } = this.state;

    this.setState({
      loading: true,
    });

    const queryPart = apiKey
      .split('.')
      .reverse()
      .reduce((a, v) => (a ? `${v} { ${a} }` : v), '');

    const query = `
        {
          ${itemType.attributes.api_key}(filter: {id: {eq: "${itemId}"}}) {
            ${this.toCamelCase(fieldPath)} {
              id
              ${fieldPath === 'subtitle_advertises' ? 'breaks' : ''}
              ${queryPart}
            }
          }
        }     
        `;

    fetch('https://graphql.datocms.com/preview', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        query,
      }),
    })
      .then(res => res.json())
      .then(res => {
        if (!Array.isArray(data)) {
          this.setState({
            loading: false,
            data: res.data[itemType.attributes.api_key][this.toCamelCase(fieldPath)],
            values: getFieldValue(fieldPath),
          });
        }
        this.initializeInteract();
      })
      .catch(() => {
        this.setState({
          loading: false,
        });
      });
  }

  initializeInteract() {
    const position = {
      x: 0,
      y: 0,
    };
    const { setFieldValue, fieldPath } = this.props;
    const { values } = this.state;

    interact('ul li')
      .dropzone({
        overlap: 0.05,

        ondropactivate(event) {
          event.target.querySelector('div')
            .classList
            .toggle('drop-active');
        },
        ondragenter(event) {
          event.relatedTarget.querySelector('div')
            .classList
            .toggle('can-drop');
        },
        ondragleave(event) {
          event.relatedTarget.querySelector('div')
            .classList
            .toggle('can-drop');
        },
        ondrop(event) {
          const dropzoneArrayIndex = values.indexOf(
            event.target.id.split('_')[1],
          );
          const draggableArrayIndex = values.indexOf(
            event.relatedTarget.id.split('_')[1],
          );

          const removedValue = values.splice(
            dropzoneArrayIndex,
            1,
            values[draggableArrayIndex],
          );
          values.splice(draggableArrayIndex, 1, removedValue[0]);

          event.relatedTarget.querySelector('div')
            .classList
            .toggle('can-drop');
          setFieldValue(fieldPath, values);
        },
        ondropdeactivate(event) {
          const e = event;
          event.target.querySelector('div')
            .classList
            .toggle('drop-active');
          e.relatedTarget.style.transform = 'translate(0px, 0px)';
          position.y = 0;
        },
      });

    interact('ul li')
      .draggable({
        modifiers: [
          interact.modifiers.restrictRect({
            restriction: 'parent',
            endOnly: false,
          }),
        ],
        startAxis: 'y',
        lockAxis: 'y',
        listeners: {
          move(event) {
            if (values.length > 1) {
              const draggableElement = event.target;

              position.x += event.dx;
              position.y += event.dy;

              draggableElement.style.transform = `translate(${position.x}px, ${position.y}px)`;
            }
          },
        },
      });
  }

  DetectBreaks(breakIndexes) {
    const breaks = {
      0: '(před představením)',
      1: '(1. přestávka)',
      2: '(2. přestávka)',
      3: '(3. přestávka)',
    };

    let breaksString = '';

    breakIndexes.sort()
      .forEach(breakIndex => {
        breaksString += `${breaks[breakIndex]}, `;
      });

    breaksString = breaksString.slice(0, breaksString.length - 2);

    return breaksString;
  }

  toUnderScore(str) {
    return str.replace(/([A-Z])/g, (x, y) => `_${y.toLowerCase()}`);
  }

  toCamelCase(str) {
    return str.replace(/(_[a-z])/g, (x, y) => y[1].toUpperCase());
  }

  renderRow(fieldValue) {
    const { apiKey, fieldPath, setFieldValue, editItem } = this.props;
    const { data, values } = this.state;

    const dataRow = data.find(bridged => bridged.id === fieldValue);

    return (
      <li key={`link_${dataRow.id}`} id={`dragdrop_${dataRow.id}`}>
        <svg
          className="hamburger"
          width="20"
          height="20"
          viewBox="0 0 92.833 92.833"
        >
          <path
            d="M89.834,1.75H3c-1.654,0-3,1.346-3,3v13.334c0,1.654,1.346,3,3,3h86.833c1.653,0,3-1.346,3-3V4.75 C92.834,3.096,91.488,1.75,89.834,1.75z"
          />
          <path
            d="M89.834,36.75H3c-1.654,0-3,1.346-3,3v13.334c0,1.654,1.346,3,3,3h86.833c1.653,0,3-1.346,3-3V39.75 C92.834,38.096,91.488,36.75,89.834,36.75z"
          />
          <path
            d="M89.834,71.75H3c-1.654,0-3,1.346-3,3v13.334c0,1.654,1.346,3,3,3h86.833c1.653,0,3-1.346,3-3V74.75 C92.834,73.095,91.488,71.75,89.834,71.75z"
          />
        </svg>
        <div key={`link_${dataRow.id}`}>
          <div className="datarow-left">
            {`${apiKey.split('.')
              .reduce((a, b) => a[b], dataRow)} ${fieldPath ===
            'subtitle_advertises' ? this.DetectBreaks(dataRow.breaks) : ''}`}
          </div>
          <div className="AdjacentButtons">
            <button
              type="button"
              className="DatoCMS-button DatoCMS-button--micro"
              onClick={() => {
                editItem(fieldValue)
                  .then(item => {
                    if (item) {
                      this.updateData();
                    }
                  });
              }}
            >
              Upravit
            </button>
            <button
              type="button"
              className="DatoCMS-button DatoCMS-button--micro DatoCMS-button--alert"
              onClick={() => {
                values.splice(values.indexOf(fieldValue), 1);
                setFieldValue(fieldPath, values);
              }}
            >
              Odstranit
            </button>
          </div>
        </div>
      </li>
    );
  }

  // ConvertModelIdToName(modelID) {
  //   const { itemTypes } = this.props;
  //   const { ConvertApiKeyToName } = this;

  //   return ConvertApiKeyToName(itemTypes[modelID].attributes.api_key);
  // }

  render() {
    const { loading, data, values } = this.state;
    const { createNewItem, field, setFieldValue, fieldPath, token } = this.props;

    if (loading) {
      return <div className="container">Načítám data...</div>;
    }

    return (
      <div className="container">
        <ul>
          {data.length > 0 && Array.isArray(values) && values.length > 0 && (
            values.map(fieldValue => this.renderRow(fieldValue))
          )}
        </ul>
        <div className="BelongsToInput__actions">
          <div className="AdjacentButtons">
            <button
              type="button"
              className="DatoCMS-button DatoCMS-button--small"
              onClick={() => {
                createNewItem(
                  field.attributes.validators.items_item_type.item_types[0],
                )
                  .then(item => {
                    if (item) {
                      this.setState({
                        loading: true,
                      });

                      const newValues = [...values];
                      newValues.push(item.id);
                      setFieldValue(fieldPath, newValues);
                      const newData = [...data];

                      const query = `{
                        staff(filter: {id: {eq: "${item.id}"}}) {
                          id
                          field {
                            title
                          }
                        }
                      }`;

                      fetch('https://graphql.datocms.com/preview', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          Accept: 'application/json',
                          Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({
                          query,
                        }),
                      })
                        .then(res => res.json())
                        .then(res => {
                          newData.push(res.data.staff);
                          this.setState({
                            loading: false,
                            values: newValues,
                            data: newData,
                          });
                        });
                    }
                  });
              }}
            >
              <svg viewBox="0 0 448 512" width="1em" height="1em">
                <path
                  d="M416 208H272V64c0-17.67-14.33-32-32-32h-32c-17.67 0-32 14.33-32 32v144H32c-17.67 0-32 14.33-32 32v32c0 17.67 14.33 32 32 32h144v144c0 17.67 14.33 32 32 32h32c17.67 0 32-14.33 32-32V304h144c17.67 0 32-14.33 32-32v-32c0-17.67-14.33-32-32-32z"
                />
              </svg>
              Nová položka &quot;Inscenační tým&quot;
            </button>
            <button type="button" className="DatoCMS-button DatoCMS-button--small">
              <svg viewBox="0 0 576 512" width="1em" height="1em">
                <path
                  d="M572.694 292.093L500.27 416.248A63.997 63.997 0 0 1 444.989 448H45.025c-18.523 0-30.064-20.093-20.731-36.093l72.424-124.155A64 64 0 0 1 152 256h399.964c18.523 0 30.064 20.093 20.73 36.093zM152 224h328v-48c0-26.51-21.49-48-48-48H272l-64-64H48C21.49 64 0 85.49 0 112v278.046l69.077-118.418C86.214 242.25 117.989 224 152 224z"
                />
              </svg>
              Z knihovny
            </button>
          </div>
        </div>
      </div>
    );
  }
}
