import React, {Component} from 'react'
import {inject, observer} from 'mobx-react'
let refUtil = require("leo-sdk/lib/reference.js");

@inject('dataStore')
@observer
class EventResubmit extends React.Component {

	constructor(props) {
		super(props);
		this.dataStore = this.props.dataStore;

		this.state = {
			bots: {},
			value: this.props.detail.payload,
			eid: this.props.detail.eid,
			botId: this.props.detail.id,
			queue: this.props.detail.event
		}
		
		this.handleChange = this.handleChange.bind(this);
		
	}


	componentWillMount() {

		var range_count = window.timePeriod.interval.split('_')
		this.currentRequest = $.get(`api/dashboard/${encodeURIComponent(this.props.detail.event)}?range=${range_count[0]}&count=${range_count[1] || 1}&timestamp=${encodeURIComponent(moment().format())}`, (result) => {
			this.setState({ bots: result.bots.read })
		}).fail((result) => {
			result.call = `api/dashboard/${encodeURIComponent(this.props.detail.event)}?range=${range_count[0]}&count=${range_count[1] || 1}&timestamp=${encodeURIComponent(moment().format())}`
			window.messageLogModal('Failure get data', 'error', result)
		})


	}

	handleChange(event) {
		this.setState({value: event.target.value});
	}

	componentDidMount() {

		LeoKit.modal($('.EventResubmitDialog'),
			{
				Resubmit: (formData) => {
					// console.log("[formData]", formData)
					// console.log("[botId]", this.state.botId)

					LeoKit.confirm('Resubmit event to queue: "' + this.state.queue + '" by botId:  "'  + this.state.botId + '".', () => {

						let payload = JSON.parse(formData.payload);
						let queue = this.state.queue;
						let botId = refUtil.botRef(this.state.botId).id;
						payload.original_eid = this.props.detail.eid

						let data = {
							botId: botId,
							queue: queue,
							payload: payload
						};
						// console.log("[data]", data)

						$.post(window.api + '/cron/save', JSON.stringify(data), (response) => {
							window.messageLogNotify('Resubmit triggered for ' + this.dataStore.nodes[formData.botId].label, 'info')
						}).fail((result) => {
							window.messageLogModal('Failure triggering resubmit for ' + this.dataStore.nodes[formData.botId].label, 'error', result)
						})

					})

				},
				cancel: false
			},
			'Resubmit Event',
			this.props.onClose
		)

	}


	componentWillUnmount() {
		if (this.currentRequest) {
			this.currentRequest.abort()
		}
	}


	render() {

		var taStyle = {
			margin: '5px 0px 15px',
			width: '750px',
			height: '255px'
		}
		return (<div>
			<div className="EventResubmitDialog theme-form">
				<div>
					<label>Edit Event</label>
					{ 
						console.log("[detail]", this.props.detail)
					}
					{
						console.log("[eid]", this.props.detail.eid.toString())
					}
					{
						console.log("[payload]", this.props.detail.payload)
					}
					<textarea id="payload" style={taStyle} name="payload" key="payload" value={JSON.stringify(this.state.value, null, 2)} onChange={this.handleChange} />
					<input type="hidden" id="botId" name="botId" value={this.state.botId} />
					<input type="hidden" id="queue" name="queue" value={this.state.queue} />
				</div>
			</div>
		</div>)

	}

}

export default EventResubmit
