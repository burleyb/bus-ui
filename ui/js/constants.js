export const systemTypes = () => {
    return {
        'Elastic Search': {
            icon: 'elasticSearch.png',
            settings: ['host']
        },
        'CSV': {
            icon: 'text_file.png',
            settings: []
        },
        'MongoDB': {
            icon: 'mongoDB.png',
            settings: ['host', 'database']
        },
        'LeoDW': {
            icon: 'LeoMane.png',
            settings: []
        },
        'Custom': {
            icon: 'system.png',
            settings: []
        }
    }
}

export const chartSettings = () => {
    return {
        'Execution Count': {
            key: "Execution Count",
            title: "Execution Count",
            series: ["Runs"],
            value: (item) => Math.round(item.value || 0),
            sla: { field: "null-0(units)" },
            fields: ['executions'],
            helpText: {
                bot: 'How many times a bot executed during the given time interval.'
            },
            helpLink: ''
        },
        'Execution Time': {
            key: "Execution Time",
            title: "Execution Time",
            series: ["Max", "Avg", "Min"],
            value: (item) => [Math.round(item.max || 0), Math.round(item.value || 0), Math.round(item.min || 0)],
            format: (value) => window.humanize(value),
            totalFormat: (value) => window.humanize(value),
            sla: { field: "/(duration,runs)" },
            fields: ['duration'],
            helpText: {
                bot: 'The average length of time in seconds that a bot executed during the given time interval.'
            },
            helpLink: ''
        },
        'Error Count': {
            key: "Error Count",
            title: "Error Count",
            value: (item) => Math.round(item.value || 0),
            sla: { field: "null-0(errors)" },
            fields: ['errors'],
            helpText: {
                bot: 'How many times the bot errored during the given time interval.'
            },
            helpLink: ''
        },
        // Add other chart settings as needed...
    }
}

// Refactor jQuery-based DOM manipulation with native React
const configureSelectOptions = (chartRef, context, config, updateChart) => {
    const selectElement = chartRef.current.previousElementSibling.querySelector('select');
    
    if (!context.configured) {
        selectElement.innerHTML = '';  // Equivalent to select.empty()
        context.options = {};

        selectElement.onchange = (e) => {
            context.expression = selectElement.value;
            config.context = context;
            updateChart(config);
        };
    }

    const expressions = Object.keys(context.expressions).sort();
    expressions.forEach((key) => {
        if (!context.options[key]) {
            const option = document.createElement('option');
            option.value = key;
            option.text = key;
            selectElement.appendChild(option);  // Equivalent to select.append()
            context.options[key] = true;
        }
    });

    context.expression = context.expression || selectElement.value;
    context.configured = true;
};
