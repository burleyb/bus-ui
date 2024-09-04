import React, { useState, useEffect } from 'react';
import TagsInput from '../elements/tagsInput.jsx';
import ComboBox from '../elements/comboBox.jsx';

const DataSourceConnect = ({ onClose }) => {
  const [step, setStep] = useState(0);
  const [active, setActive] = useState(false);
  const [text, setText] = useState('');
  const [host, setHost] = useState('');
  const [database, setDatabase] = useState('');
  const [icon, setIcon] = useState('');
  const [tags, setTags] = useState([]);
  const [queueTags, setQueueTags] = useState([]);
  let modal;

  useEffect(() => {
    modal = LeoKit.modal(
      $('.DataSourceConnect'),
      {},
      '<i class="icon-database" /> Connect to a data source',
      onClose
    );

    return () => {
      LeoKit.closeModal(modal);
    };
  }, [onClose]);

  const onChoose = () => {
    setStep(1);
    LeoKit.center(modal);
  };

  const handleFocus = () => {
    setActive(true);
    console.log('focus');
  };

  const handleBlur = () => {
    setTimeout(() => {
      setActive(false);
      console.log('blur');
    }, 100);
  };

  const handleChange = (event) => {
    setText(event.currentTarget.value);
  };

  const onNext = () => {
    setStep((prevStep) => prevStep + 1);
  };

  const onPrev = () => {
    setStep((prevStep) => prevStep - 1);
  };

  return (
    <div>
      <div className="DataSourceConnect">
        {step === 0 ? (
          <div>
            <div style={{ maxWidth: 890, padding: 45 }}>
              <div className="flex-row flex-spread">
                <div className="theme-section-header">Choose a New Data Source</div>
                <div>
                  <label className="theme-form-label">Existing Data Sources</label>
                  <select className="theme-form-input">
                    <option>Select an existing data source...</option>
                  </select>
                </div>
              </div>

              <div className="flex-row" style={{ flexWrap: 'wrap', marginLeft: -8 }}>
                <button
                  type="button"
                  className="theme-button-big align-middle"
                  onClick={onChoose}
                >
                  <img src={window.leostaticcdn + '/images/icons/leaf.png'} alt="MongoDB" />
                  mongoDB
                </button>

                <button type="button" className="theme-button-big align-middle">
                  <img src={window.leostaticcdn + '/images/icons/gear.png'} alt="Custom" />
                  Custom
                </button>

                <button
                  type="button"
                  className="theme-button-big align-middle flex-row disabled"
                >
                  <img src={window.leostaticcdn + '/images/icons/gear.png'} alt="MySQL" />
                  <div className="display-inline-block">
                    <small>coming soon</small> MySQL
                  </div>
                </button>

                <button
                  type="button"
                  className="theme-button-big align-middle flex-row disabled"
                >
                  <img src={window.leostaticcdn + '/images/icons/gear.png'} alt="SQL" />
                  <div className="display-inline-block">
                    <small>coming soon</small> SQL
                  </div>
                </button>

                <button
                  type="button"
                  className="theme-button-big align-middle flex-row disabled"
                >
                  <img src={window.leostaticcdn + '/images/icons/gear.png'} alt="Webhook" />
                  <div className="display-inline-block">
                    <small>coming soon</small> Webhook
                  </div>
                </button>
              </div>
            </div>

            <footer
              className="flex-row"
              style={{ background: '#E2E2E2', maxWidth: 890, padding: '20px 45px' }}
            >
              <div className="flex-grow">
                <div className="theme-section-header">Leo SDK</div>
                <div className="theme-section-subheader">
                  Load events directly using the Leo SDK:
                </div>
                <table className="theme-plain-table">
                  <tbody>
                    <tr>
                      <th>nodeJS</th>
                      <td>
                        <a href={window.leoDocsLink} target="documentation">
                          Docker
                        </a>
                      </td>
                      <td>|</td>
                      <td>
                        <a href={window.leoDocsLink} target="documentation">
                          Github
                        </a>
                      </td>
                    </tr>
                    <tr>
                      <th>php</th>
                      <td>
                        <a href={window.leoDocsLink} target="documentation">
                          Docker
                        </a>
                      </td>
                      <td>|</td>
                      <td>
                        <a href={window.leoDocsLink} target="documentation">
                          Github
                        </a>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="flex-grow">
                <div className="theme-section-header">Leo API</div>
                <div className="theme-section-subheader">
                  Data can also be added via the Leo API:
                </div>
                <a href={window.leoDocsLink} target="documentation">
                  API documentation
                </a>
              </div>
            </footer>
          </div>
        ) : (
          <div className="theme-tabs">
            <ul>
              <li className={step === 1 ? 'active' : ''}>Connection</li>
              <li className={step === 2 ? 'active' : 'disabled'}>Destination</li>
              <li className={step === 3 ? 'active' : 'disabled'}>Bot</li>
            </ul>
            <div>
              {/* Step 1 */}
              <div className={`theme-form ${step === 1 ? 'active' : ''}`}>
                <ComboBox
                  label="Connection Profile"
                  placeholder="Choose a connection profile..."
                  icon={window.leostaticcdn + 'images/system.png'}
                  name="connection profile"
                />

                <div className="theme-form-section">
                  <div className="theme-form-group-heading">Connection Profile Details</div>

                  <div className="theme-required">
                    <label>Host</label>
                    <input
                      type="text"
                      name="host"
                      defaultValue={host}
                      onChange={(e) => setHost(e.target.value)}
                    />
                  </div>

                  <div className="theme-required">
                    <label>Database</label>
                    <input
                      type="text"
                      name="database"
                      defaultValue={database}
                      onChange={(e) => setDatabase(e.target.value)}
                    />
                  </div>

                  <div>
                    <label>Icon</label>
                    <input
                      type="url"
                      name="icon"
                      defaultValue={icon}
                      placeholder="http://"
                      onChange={(e) => setIcon(e.target.value)}
                    />
                    <div>
                      <small className="field-description">
                        A custom icon can help this data source be quickly identified in the
                        workflow.
                      </small>
                    </div>
                  </div>

                  <div>
                    <label>Tags</label>
                    <TagsInput
                      name="tags"
                      defaultValue={tags}
                      onChange={setTags}
                    />
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className={`theme-form ${step === 2 ? 'active' : ''}`}>
                <ComboBox
                  label="Queue name"
                  placeholder="Add a queue..."
                  icon={window.leostaticcdn + 'images/queue.png'}
                  name="queue"
                />
                <div>
                  <label>Tags</label>
                  <TagsInput
                    name="queue_tags"
                    defaultValue={queueTags}
                    onChange={setQueueTags}
                  />
                </div>
              </div>

              {/* Step 3 */}
              <div className={`theme-form ${step === 3 ? 'active' : ''}`}>
                <div className="theme-required">
                  <label>Bot name</label>
                  <input />
                </div>

                <div className="theme-required">
                  <label>Description</label>
                  <textarea />
                </div>

                <div>
                  <label>Tags</label>
                  <TagsInput
                    name="queue_tags"
                    defaultValue={queueTags}
                    onChange={setQueueTags}
                  />
                </div>

                <div className="theme-form-section">
                  <div className="theme-form-group-heading">Bot Settings</div>

                  <div className="theme-required">
                    <label>Collection</label>
                    <input />
                  </div>
                </div>
              </div>
            </div>

            <div className="form-button-bar">
              {step > 1 && (
                <button
                  type="button"
                  className="theme-button pull-left"
                  onClick={onPrev}
                >
                  Prev
                </button>
              )}
              <div className="pull-right">
                <button type="button" className="theme-button">
                  Cancel
                </button>
                {step === 3 ? (
                  <button
                    type="button"
                    className="theme-button-primary"
                    onClick={onNext}
                  >
                    Create Data Source
                  </button>
                ) : (
                  <button
                    type="button"
                    className="theme-button-primary"
                    onClick={onNext}
                  >
                    Next
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataSourceConnect;
