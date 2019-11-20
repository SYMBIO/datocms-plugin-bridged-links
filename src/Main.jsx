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
  };

  state = {
    loading: true,
    data: {},
    values: [],
  };

  componentDidMount() {
    this.updateData();
  }

  getAdvertisementRow(fieldValue) {
    const {
      apiKey, fieldPath, setFieldValue, editItem,
    } = this.props;
    const { data, values } = this.state;
    const { ConvertApiKeyToName, DetectBreaks } = this;

    const dataRow = data.find(bridged => (
      bridged.id === fieldValue
    ));

    const apiKeyName = ConvertApiKeyToName(apiKey).split('.');

    return (
      <div key={`link_${dataRow.id}`} id={`dragdrop_${dataRow.id}`}>
        <svg className="hamburger" width="14" height="14" viewBox="0 0 92.833 92.833">
          <path d="M89.834,1.75H3c-1.654,0-3,1.346-3,3v13.334c0,1.654,1.346,3,3,3h86.833c1.653,0,3-1.346,3-3V4.75 C92.834,3.096,91.488,1.75,89.834,1.75z" />
          <path d="M89.834,36.75H3c-1.654,0-3,1.346-3,3v13.334c0,1.654,1.346,3,3,3h86.833c1.653,0,3-1.346,3-3V39.75 C92.834,38.096,91.488,36.75,89.834,36.75z" />
          <path d="M89.834,71.75H3c-1.654,0-3,1.346-3,3v13.334c0,1.654,1.346,3,3,3h86.833c1.653,0,3-1.346,3-3V74.75 C92.834,73.095,91.488,71.75,89.834,71.75z" />
        </svg>
        <li key={`link_${dataRow.id}`}>
          {`${dataRow[apiKeyName[0]][apiKeyName[1]]} (${fieldPath === 'subtitle_advertises' && DetectBreaks(dataRow.breaks)})`}
          <button
            type="button"
            className="DatoCMS-button--micro"
            onClick={() => {
              editItem(fieldValue)
                .then(() => {
                  this.updateData(true);
                });
            }}
          >
            Upravit
          </button>
          <button
            type="button"
            className="DatoCMS-button--micro"
            onClick={() => {
              values.splice(values.indexOf(fieldValue), 1);
              setFieldValue(fieldPath, values);
            }}
          >
            Odstranit
          </button>
        </li>
      </div>
    );
  }

  DetectBreaks(breakIndexes) {
    const breaks = {
      0: 'Před představením',
      1: '1. přestávka',
      2: '2. přestávka',
      3: '3. přestávka',
    };

    let breaksString = '';

    breakIndexes.sort().forEach((breakIndex) => {
      breaksString += `${breaks[breakIndex]}, `;
    });

    breaksString = breaksString.slice(0, breaksString.length - 2);

    return breaksString;
  }

  ConvertApiKeyToName(apiKey) {
    if (apiKey.indexOf('_') > -1) {
      const keys = apiKey.split('.');
      let res = '';

      keys.forEach((key) => {
        const crumbs = key.split('_');
        res += `${crumbs[0]}${crumbs[1].charAt(0).toUpperCase()}${crumbs[1].slice(1)}.`;
      });

      return res.slice(0, res.length - 1);
    }

    return apiKey;
  }

  initializeInteract() {
    const position = { x: 0, y: 0 };
    const { setFieldValue, fieldPath } = this.props;
    const { values } = this.state;

    interact('ul div').dropzone({
      overlap: 0.05,

      ondropactivate(event) {
        event.target.classList.toggle('drop-active');
      },
      ondragenter(event) {
        event.relatedTarget.classList.toggle('can-drop');
      },
      ondragleave(event) {
        event.relatedTarget.classList.toggle('can-drop');
      },
      ondrop(event) {
        const dropzoneArrayIndex = values.indexOf(event.target.id.split('_')[1]);
        const draggableArrayIndex = values.indexOf(event.relatedTarget.id.split('_')[1]);

        const removedValue = values.splice(
          dropzoneArrayIndex,
          1,
          values[draggableArrayIndex],
        );
        values.splice(draggableArrayIndex, 1, removedValue[0]);

        event.relatedTarget.classList.toggle('can-drop');
        setFieldValue(fieldPath, values);
      },
      ondropdeactivate(event) {
        const e = event;
        e.target.classList.toggle('drop-active');
        e.relatedTarget.style.transform = 'translate(0px, 0px)';
        position.y = 0;
      },
    });

    interact('ul div').draggable({
      modifiers: [
        interact.modifiers.restrictRect({
          restriction: '.container',
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

  updateData(cache) {
    const {
      token, itemId, fieldPath, apiKey, itemType, getFieldValue,
    } = this.props;
    const { values } = this.state;
    const { ConvertApiKeyToName } = this;

    const apiKeyName = ConvertApiKeyToName(apiKey).split('.');
    const fieldPathName = ConvertApiKeyToName(fieldPath);

    this.setState({
      loading: true,
    });

    fetch('https://graphql.datocms.com/preview', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        query: `
        {
          ${itemType.attributes.api_key}(filter: {id: {eq: "${itemId}"}}) {
            ${fieldPathName} {
              id
              ${fieldPath === 'subtitle_advertises' && 'breaks'}
              ${apiKeyName[0]} {
                ${apiKeyName[1]}
              }
            }
          }
        }     
        `,
      }),
    })
      .then(res => res.json())
      .then((res) => {
        this.setState({
          loading: false,
          data: res.data.production[fieldPathName],
          values: !cache ? getFieldValue(fieldPath) : values,
        });
        this.initializeInteract();
      })
      .catch((error) => {
        this.setState({
          loading: false,
        });
        console.log(error);
      });
  }

  render() {
    const { loading, data, values } = this.state;

    if (loading) {
      return <div className="container">Načítám data...</div>;
    }

    console.log(data);
    console.log(values);

    return (
      <div className="container">
        {data.length > 0
          ? Array.isArray(values) && values.length > 0 ? (
            <ul>
              {values.map(fieldValue => (
                this.getAdvertisementRow(fieldValue)
              ))}
            </ul>
          ) : 'Zatím žádné hodnoty...'
          : 'V cílovém modelu nejsou žádné záznamy, nebo jste chybně zadali cestu...'
        }
      </div>
    );
  }
}
