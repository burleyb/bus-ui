import React, { useState, useEffect } from 'react';
import TagsInput from '../elements/tagsInput.jsx';
import $ from 'jquery';

const Topics = ({ onClose }) => {
  const [topics, setTopics] = useState(false);
  const [subscriptions, setSubscriptions] = useState(false);
  const [basicArn] = useState('arn:aws:sns:us-west-2:134898387190:');
  const [arn, setArn] = useState('');
  const [dialog, setDialog] = useState('');
  const [defaults, setDefaults] = useState({});
  const [topicInfo, setTopicInfo] = useState({});

  useEffect(() => {
    $.get('api/sns_get', (data) => {
      setTopicInfo(data);
      setupData(data);
    }).fail((result) => {
      window.messageLogNotify('Failure Retrieving SNS Data', 'warning', result);
    });

    const modal = LeoKit.modal($('#manageTopics'), {}, 'Manage Topics', onClose);

    return () => {
      LeoKit.closeModal(modal); // Clean up modal on unmount
    };
  }, [onClose]);

  const setupData = (data) => {
    const topics = {};
    const regEx = RegExp(/(?:)([^:]*)$/g);
    Object.keys(data.topicAttributes).forEach((key) => {
      topics[key] = {
        topicName: key.match(regEx)[0] || '',
        displayName: data.topicAttributes[key]?.displayName || key,
        owner: data.topicAttributes[key]?.owner || '',
      };
    });
    setTopics(topics);
    setSubscriptions(data.subs);
  };

  const toggleDialog = (dialog, defaults = {}) => {
    setDialog(dialog);
    setDefaults(defaults);
  };

  const editTopic = (arn) => {
    setDialog('UpdateTopic');
    setDefaults(topics[arn] || {});
  };

  const updateTopic = (topic) => {
    $.post(`api/sns_save/topic/${topic.arn}`, (response) => {
      const updatedTopics = { ...topics };
      const updatedSubs = { ...subscriptions };
      updatedTopics[response.TopicArn] = { topicName: response.TopicArn, displayName: response.TopicArn, owner: response.TopicArn };
      updatedSubs[response.TopicArn] = [];
      setTopics(updatedTopics);
      setSubscriptions(updatedSubs);
      window.messageLogNotify(`Topic ${topic.arn} created`);
    }).fail((result) => {
      window.messageLogModal(`Failed to create topic ${topic.arn}`, 'error', result);
    });
  };

  const editSubscription = (id) => {
    setDialog('UpdateSubscription');
    setDefaults(subscriptions[id] || { topicARN: arn });
  };

  const updateSubscription = (subscription) => {
    const body = {
      subscribe: true,
      protocol: subscription.protocol,
      endpoint: String(subscription.endpoint),
    };
    $.post(`api/sns_save/subscription/${subscription.topicARN}`, JSON.stringify(body), (response) => {
      const updatedSubs = { ...subscriptions };
      if (response.SubscriptionArn === 'pending confirmation') {
        response.SubscriptionArn = 'PendingConfirmation';
      }
      updatedSubs[subscription.topicARN].push({
        Endpoint: subscription.endpoint,
        Protocol: subscription.protocol,
        SubscriptionArn: response.SubscriptionArn,
        TopicArn: subscription.topicARN,
      });
      setSubscriptions(updatedSubs);
      window.messageLogNotify(`Subscription for "${subscription.endpoint}" created`);
    }).fail((result) => {
      window.messageLogModal('Failed to create subscription', 'error', result);
    });
  };

  const deleteSubscription = (id) => {
    LeoKit.confirm(`Delete subscription for "${id.Endpoint}"?`, () => {
      $.post(`api/sns_save/subscription/${id.TopicArn}`, JSON.stringify({ unSub: id.SubscriptionArn }), () => {
        const updatedSubs = { ...subscriptions };
        Object.keys(updatedSubs[id.TopicArn]).forEach((key) => {
          if (updatedSubs[id.TopicArn][key].SubscriptionArn === id.SubscriptionArn) {
            delete updatedSubs[id.TopicArn][key];
            setSubscriptions(updatedSubs);
          }
        });
        window.messageLogNotify(`Subscription for ${id.Endpoint} deleted`);
      }).fail((result) => {
        window.messageLogModal('Failed to delete subscription', 'error', result);
      });
    });
  };

  const selectRow = (table, row) => {
    const data = topicInfo?.tags?.tags || {};
    const tags = Object.keys(data).filter((tag) => data[tag].indexOf(row) !== -1);
    setArn(row);
    setDefaults({ ...defaults, tags });
  };

  const topic = topics[arn] || {};

  return (
    <div className="display-none">
      <div id="manageTopics" className="flex-row xbeta-feature overflow-hidden" style={{ height: 'calc(100vh - 130px)', maxHeight: 'inherit' }}>
        <div className="flex-column width-1-3 height-1-1 padding-small">
          <strong className="text-left">Topics</strong>
          <div className="theme-table-fixed-header">
            <table>
              <thead>
                <tr>
                  <th>Display Name</th>
                  <th className="theme-2-icon-column"></th>
                </tr>
              </thead>
              <tbody>
                {topics ? Object.keys(topics).map((arn) => (
                  <tr key={arn} className={arn === arn ? 'active' : ''} onClick={() => selectRow('arn', arn)}>
                    <td>{topics[arn].displayName}</td>
                  </tr>
                )) : (
                  <tr>
                    <td><div className="theme-spinner-small" /></td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="text-right padding-small">
            <div className="theme-button-primary" onClick={() => editTopic(false)}>Create Topic</div>
          </div>
        </div>
        {arn && (
          <div className="flex-column width-2-3 height-1-1 padding-small">
            <strong>Topic Details: {topic.displayName === arn ? '' : topic.displayName}</strong>
            <div className="theme-form">
              <div><label>Topic ARN</label><span className="user-selectable">{arn}</span></div>
              <div><label>Topic Owner</label><span>{topic.owner}</span></div>
              <div><label>Display Name</label><span>{topic.displayName === arn ? '' : topic.displayName}</span></div>
              <div><label>Tags</label><TagsInput name="tags" defaultValue={defaults.tags} alerts={true} tags={topicInfo?.tags || {}} arn={arn} /></div>
            </div>
            <strong className="text-left">Subscriptions</strong>
            <div className="theme-table-fixed-header theme-table-overflow-hidden">
              <table>
                <thead>
                  <tr>
                    <th className="width-1-2">Subscription ID</th>
                    <th>Protocol</th>
                    <th>Endpoint</th>
                    <th className="theme-2-icon-column"></th>
                  </tr>
                </thead>
                <tbody>
                  {subscriptions && subscriptions[arn] ? subscriptions[arn].map((sub, id) => (
                    <tr key={id}>
                      <td className="width-1-2">{sub.SubscriptionArn}</td>
                      <td>{sub.Protocol}</td>
                      <td>{sub.Endpoint}</td>
                      {sub.SubscriptionArn !== 'PendingConfirmation' ? (
                        <td className="theme-2-icon-column">
                          <i className="icon-cancel cursor-pointer" onClick={() => deleteSubscription(sub)} />
                        </td>
                      ) : (
                        <td className="theme-2-icon-column"></td>
                      )}
                    </tr>
                  )) : (
                    <tr>
                      <td><div className="theme-spinner-small" /></td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="text-right padding-small">
              <div className="theme-button-primary" onClick={() => editSubscription(false)}>Create Subscription</div>
            </div>
          </div>
        )}
        {dialog === 'UpdateTopic' && (
          <UpdateTopic defaults={defaults} updateTopic={updateTopic} onClose={() => toggleDialog(false)} />
        )}
        {dialog === 'UpdateSubscription' && (
          <UpdateSubscription defaults={defaults} updateSubscription={updateSubscription} topics={topics} onClose={() => toggleDialog(false)} />
        )}
      </div>
    </div>
  );
};

export default Topics;
