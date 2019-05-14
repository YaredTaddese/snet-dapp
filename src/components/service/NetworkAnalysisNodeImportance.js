import React from 'react';
import ReactJson from 'react-json-view';
import PropTypes from 'prop-types';
import {
    Grid,
    Card,
    CardContent,
    Button,
    TextField,
    FormControl,
    FormControlLabel,
    InputLabel,
    MenuItem,
    Select,
    Checkbox,
    Divider,
    Icon,
    FormHelperText,
    Typography
}
    from "@material-ui/core";
import classNames from 'classnames';
import { createMuiTheme, MuiThemeProvider, withStyles, withTheme } from "@material-ui/core/styles";
import { blue } from '@material-ui/core/colors';
import { CheckCircle, Cancel } from "@material-ui/icons";
import ResetIcon from '@material-ui/icons/Autorenew';
import ValidateIcon from '@material-ui/icons/LineStyle';
import CallIcon from '@material-ui/icons/SettingsRemote';

import TextUploader from "./analysis-helpers/TextUploader";

/******************************************
* Constants
*******************************************/
const InputType = { File: 'File Upload', Text: 'Textual Input' };

const Modes = {
    CentralNodes: 'Central Nodes',
    PeripherialNodes: 'Peripherial nodes',
    DegreeCentrality: 'Degree Centrality',
    ClosenessCentrality: 'Closeness Centrality',
    BetweennessCentrality: 'Betweenness Centrality',
    EigenCentrality: 'Eigen Vector Centrality',
    PageRank: 'Page Rank',
    Hits: 'Hits',
};

// parameters for different modes(all are boolean unless stated otherwise)
const Parameters = {
    useBounds: 'useBounds',
    distance: 'distance',
    wf_improved: 'wf_improved',
    reverse: 'reverse',
    directed: 'directed',
    type: 'type',
    normalized: 'normalized',
    weight: 'weight',
    endpoints: 'endpoints',
    seed: 'seed', // number
    k: 'k', // number
}

const CheckboxParameters = {
    [Parameters.useBounds]: { label: 'Use Bounds' },
    [Parameters.distance]: { label: 'Use Distance' },
    [Parameters.wf_improved]: { label: 'Use wf_improved' },
    [Parameters.reverse]: { label: 'Reverse' },
    [Parameters.directed]: { label: 'Directed Graph' },
    [Parameters.normalized]: { label: 'Normalized' },
    [Parameters.weight]: { label: 'Use Weight' },
    [Parameters.endpoints]: { label: 'Endpoints' },
}

const NumberParameters = {
    [Parameters.seed]: { label: 'Seed', helperText: 'A seed for random number generator' }, // number
    [Parameters.k]: { label: 'k', helperText: 'k' }, // number
}

const SampleGraph = {
    "graph":
    {
        "nodes": ["1", "2", "3", "4", "5", "6", "7", "8"],
        "edges": [
            { "edge": ["1", "2"] }, { "edge": ["1", "4"] }, { "edge": ["2", "3"] }, { "edge": ["2", "5"] },
            { "edge": ["3", "4"] }, { "edge": ["3", "6"] }, { "edge": ["2", "7"] }, { "edge": ["3", "8"] }
        ]
    }
};


/******************************************
* Styles and theme
*******************************************/
const styles = theme => ({
    root: {
        display: 'flex',
        flexWrap: 'wrap',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        // border: 'solid red 1px',
    },
    container: {
        display: 'flex',
        width: '100%',
        marginTop: theme.spacing.unit,
        marginBottom: theme.spacing.unit,
        // border: 'solid black 1px',
    },
    formControl: {
        margin: theme.spacing.unit * 2,
        minWidth: 120,
        width: '100%',
    },
    selectEmpty: {
        marginTop: theme.spacing.unit * 2,
    },
    item: {
        display: 'flex',
        justifyContent: 'center',
        // border: 'solid black 1px',
    },
    divider: {
        width: '90%',
        marginLeft: 'auto',
        marginRight: 'auto',
    },
    button: {
        margin: theme.spacing.unit,
    },
    leftIcon: {
        marginRight: theme.spacing.unit,
        fontSize: 20,
    },
    error: {
        color: '#f44336',
    },
    centerText: {
        textAlign: 'center',
    }
});

const theme = createMuiTheme({
    palette: {
        primary: blue,
    },
    typography: {
        useNextVariants: true,
        fontSize: 20,
    },
});

class NodeImportance extends React.Component {
    constructor(props) {
        super(props);

        this.handleFormUpdate = this.handleFormUpdate.bind(this);

        // setup validators for each form input
        this.validateTextInput = this.validateTextInput.bind(this);
        this.validateK = this.validateK.bind(this);

        this.validators = {
            [InputType.Text]: this.validateTextInput,
            [Parameters.k]: this.validateK,
        };

        this.validateText = this.validateText.bind(this);
        this.validateAllValues = this.validateAllValues.bind(this);
        this.createRequestInputs = this.createRequestInputs.bind(this);

        this.resetInternalState = this.resetInternalState.bind(this);
        this.setParameterState = this.setParameterState.bind(this);

        this.renderParameters = this.renderParameters.bind(this);

        this.handleUploadedTexts = this.handleUploadedTexts.bind(this);
        this.submitAction = this.submitAction.bind(this);

        this.download = this.download.bind(this);

        this.state = this.getInitialState();
    }

    /**************************************
     * State related operations
     **************************************/
    getInitialState() {
        return {
            serviceName: "NodeImportance",
            methodName: "Select a method",

            file_texts: [],

            // form inputs
            [InputType.Text]: '',

            mode: Modes.CentralNodes,
            [Parameters.useBounds]: false,

            errors: {},

            fileAccept: "text/plain",
            inputType: InputType.Text,
        }
    }

    // set error state appropriately
    // since error state is a nested object in state, it needs some workaround
    setErrorState(partial_errors) {
        let nested_error_object = this.state.errors;
        Object.assign(nested_error_object, partial_errors);
        this.setState({ errors: nested_error_object });
    }

    resetInternalState() {
        this.setState(this.getInitialState());
        
        this.setParameterState(this.state.mode);
    }

    setParameterState(mode) {
        let parameters = {};
        for (let param in Parameters) {
            parameters[param] = undefined;
        }

        if (mode === Modes.CentralNodes || mode === Modes.PeripherialNodes) {
            parameters[Parameters.useBounds] = false;
        } else if (mode === Modes.ClosenessCentrality) {
            parameters[Parameters.distance] = false;
            parameters[Parameters.wf_improved] = false;
            parameters[Parameters.reverse] = false;
            parameters[Parameters.directed] = false;
        } else if (mode === Modes.BetweennessCentrality) {
            parameters[Parameters.type] = 'node';
            parameters[Parameters.k] = '0';
            parameters[Parameters.normalized] = true;
            parameters[Parameters.weight] = false;
            parameters[Parameters.endpoints] = false;
            parameters[Parameters.seed] = '0';
            parameters[Parameters.directed] = false;
        }

        this.setState(parameters);
    }

    /****************************************
     * Form validation operations
     ****************************************/
    validateTextInput() {
        return this.validateText(InputType.Text, this.state[InputType.Text]);
    }

    isObject(value) {
        return value && typeof value === 'object' && value.constructor === Object;
    }

    isArray(value) {
        return value && typeof value === 'object' && value.constructor === Array;
    }

    validateText(inputType, textValue, fileName) {
        if (textValue.trim().length === 0) {
            if (fileName) {
                return { [inputType]: `File '${fileName}' is empty. Text should not be empty.` }
            } else {
                return { [inputType]: "Text can not be empty" };
            }
        } else {
            let json = null;
            try {
                json = JSON.parse(textValue);
            } catch (err) {
                if (err instanceof SyntaxError) {
                    if (fileName) {
                        return { [inputType]: `File '${fileName}' content is not a valid JSON.` };
                    } else {
                        return { [inputType]: `Text is not a valid JSON.` };
                    }
                }

                // if error is not syntax error, then it is not about valid or invalid json
                return { [inputType]: `Something went wrong when trying to parse text to JSON. Please, try again.` };
            }

            if (!this.isObject(json)) {
                if (fileName) {
                    return { [inputType]: `File '${fileName}' content is not an object in JSON format.` };
                } else {
                    return { [inputType]: `Text must be an object in JSON format.` };
                }
            } else if (
                Object.keys(json).length !== 1
                || !this.isObject(json["graph"])
                || Object.keys(json["graph"]).length !== 2
                || !this.isArray(json["graph"]["nodes"])
                || !this.isArray(json["graph"]["edges"])
            ) {
                if (fileName) {
                    return {
                        [inputType]:
                            `The JSON object structure in File '${fileName}' content must be 
                            \n\t{"graph": {"nodes": [...], "edges": [...]}}.`
                    };
                } else {
                    return {
                        [inputType]:
                            `The JSON object structure in the text must be 
                            \n\t{ "graph" : { "nodes" : [...], "edges" : [...] } }.` };
                }
            }

            return { [inputType]: null };
        }
    }

    validateNumber(number_string, field_name, only_integer) {
        let validation = { number: null, error: null };
        if (number_string.trim().length === 0) {
            validation.error = `${field_name} must be specified as a number.`;
            return validation;
        }

        let float_value = parseFloat(number_string);
        if (isNaN(float_value) || !isFinite(float_value)) {
            validation.error = `${field_name} must be a number.`;
            return validation;
        }

        if (only_integer) {
            if (/\./.test(number_string)) {
                console.log('dot found in validation');
                validation.error = `${field_name} must be an integer.`;
                return validation;
            } else {
                validation.number = parseInt(float_value);
                return validation;
            }
        } else {
            validation.number = float_value;
            return validation;
        }
    }

    validateK() {
        if (this.state.k !== undefined) {
            let validation = this.validateNumber(this.state.k, Parameters.k, true);
            if (validation.error) {
                return { [Parameters.k]: validation.error };
            } else if (validation.number < 0) {
                return { [Parameters.k]: "k should not be negative." };
            }
        }

        return { [Parameters.k]: null };
    }

    validateAllValues() {
        // utilize all validators function since we have to validate everything
        let found_errors = {};

        if (this.state.methodName === "Select a method") {
            Object.assign(found_errors, { "methodName": "No method selected." });
        }

        if (this.state.k !== undefined) {
            let state_error = this.validators.k();
            if (state_error.k) {
                Object.assign(found_errors, this.validators.k());
            }
        }

        let file_texts_errors = [];
        if (this.state.inputType === InputType.Text) {
            let state_error = this.validators[InputType.Text]();
            if (state_error[InputType.Text]) {
                Object.assign(found_errors, state_error);
            }
        } else if (this.state.inputType === InputType.File) {
            if (this.state.file_texts.length === 0) {
                let state_error = { [InputType.File]: "No file selected" }
                Object.assign(found_errors, state_error);
            } else {
                for (let text of this.state.file_texts) {
                    if (text.error) {
                        file_texts_errors.push(text.error);
                    }
                }
            }
        }

        this.setErrorState(found_errors);
        console.log('found_errors: ', found_errors);
        console.log('file_texts_errors: ', file_texts_errors);
        // check if there is an error property or errors object is empty
        return Object.keys(found_errors).length === 0 && file_texts_errors.length === 0;
    }

    /****************************************
     * Form inputs change handling operations
     ****************************************/
    handleFormUpdate(event) {
        const event_target_name = event.target.name;
        const event_target_value = (event.target.type === 'checkbox') ? event.target.checked : event.target.value;
        console.log('target_value: ', event_target_value);
        console.log('target_name: ', event_target_name);
        console.log('target type: ', event.target.type);
        this.setState({ [event_target_name]: event_target_value }, () => {
            // run validation and other codes after ensuring state is updated
            if (event_target_name in this.validators) {
                console.log('validation performed');
                // validate form input change
                let state_error = this.validators[event_target_name]();
                this.setErrorState(state_error);
            }

            if (event_target_name === 'methodName' || event_target_name === 'mode') {
                let state_error = { [event_target_name]: null }

                if (this.state.inputType === InputType.Text) {
                    state_error[InputType.Text] = null;
                    this.setState({ [InputType.Text]: JSON.stringify(SampleGraph, null, 4) });
                }

                this.setErrorState(state_error);    // discard errors if there were

                if (event_target_name === 'mode') {
                    this.setParameterState(event_target_value);
                }
            }
        });
    }

    handleUploadedTexts(texts) {
        this.setState({ file_texts: texts });
        this.setErrorState({ [InputType.File]: null });
        console.log('handleUploadedTexts: ', texts);
    }

    /****************************************
     * Form submitting operations
     ****************************************/
    createRequestInputs() {
        let areAllValidInputs = this.validateAllValues();

        if (areAllValidInputs) {
            let request_inputs = {};

            // since JSON format is validated, no parsing trouble is assumed when processing texts
            if (this.state.inputType === InputType.Text) {
                request_inputs.graph = JSON.parse(this.state[InputType.Text]);
            } else {
                let graphs = [];
                for (let file_text of this.state.file_texts) {
                    graphs = graphs.concat(JSON.parse(file_text.content));
                }

                request_inputs.graph = graphs[0];
            }

            for (let param in Parameters) {
                if (this.state[param] !== undefined) {
                    request_inputs[param] = this.state[param];
                }
            }

            return request_inputs;
        }

        return null;
    }

    submitAction() {
        let request_inputs = this.createRequestInputs();
        console.log('request_inputs', request_inputs);
        if (request_inputs) {
            this.props.callApiCallback(this.state.serviceName,
                this.state.methodName, request_inputs);
        }
    }

    /****************************************
     * Result downloading operations
     ****************************************/
    download() {
        const link = document.createElement('a');
        link.setAttribute("type", "hidden");
        link.setAttribute('href', "data:text/json," + JSON.stringify(this.props.response));
        link.setAttribute('download', 'result.json');
        document.body.appendChild(link);
        link.click();

        link.remove();
    }

    /****************************************
     * UI rendering operations
     ****************************************/
    renderMuiServiceMethodNames(serviceMethodNames) {
        const serviceNameOptions = ["Select a method", ...serviceMethodNames];
        return serviceNameOptions.map((serviceMethodName, index) => {
            return <MenuItem value={serviceMethodName} key={index}>{serviceMethodName}</MenuItem>;
        });
    }

    renderMuiFormInputTypes() {
        return Object.values(InputType).map((inputType, index) => {
            return <MenuItem value={inputType} key={index}>{inputType}</MenuItem>;
        });
    }

    renderMuiModes() {
        return Object.values(Modes).map((mode, index) => {
            return <MenuItem value={mode} key={index}>{mode}</MenuItem>;
        });
    }

    renderTextDataInput(classes) {
        if (this.state.inputType === InputType.Text) {
            return <TextField className={classes.formControl}
                id={InputType.Text}
                name={InputType.Text}
                label="Text Input"
                multiline
                fullWidth
                rows="6"
                value={this.state[InputType.Text]}
                margin="normal"
                variant="outlined"
                onChange={this.handleFormUpdate}
                error={Boolean(this.state.errors[InputType.Text])}
                helperText={this.state.errors[InputType.Text] || 'Text must be a graph object in JSON format.'}
            />;
        } else if (this.state.inputType === InputType.File) {
            return (<div className={classes.formControl}>
                <TextUploader
                    handleUploadedTexts={this.handleUploadedTexts}
                    validateText={this.validateText}
                    fileAccept={this.state.fileAccept}
                    multiple={false}
                    parentRejection={this.state.errors[InputType.File]}
                />
                {this.state.errors[InputType.File]
                    && <FormHelperText error className={classes.centerText}>
                        {this.state.errors[InputType.File]}
                    </FormHelperText>
                }
            </div>)
                ;
        } else {
            return <Typography variant='body1' className={classNames(classes.formControl, classes.centerText)}>
                Select an appropriate input type
            </Typography>
        }
    }

    renderParameters() {
        const { classes } = this.props;

        let rendered_parameters = [];
        for (let checkbox_param in CheckboxParameters) {
            if (this.state[checkbox_param] !== undefined) {
                rendered_parameters.push(
                    <Grid item sm={6} className={classes.item}>
                        <FormControlLabel className={classes.formControl}
                            control={
                                <Checkbox name={checkbox_param} id={checkbox_param}
                                    checked={this.state[checkbox_param]}
                                    onChange={this.handleFormUpdate} />
                            }
                            label={CheckboxParameters[checkbox_param].label}
                        />
                    </Grid>
                );
            }
        }

        for (let num_param in NumberParameters) {
            if (this.state[num_param] !== undefined) {
                rendered_parameters.push(
                    <Grid item sm={6} className={classes.item}>
                        <TextField className={classes.formControl}
                            id={num_param}
                            name={num_param}
                            label={NumberParameters[num_param].label}
                            type="number"
                            margin="normal"
                            value={this.state[num_param]}
                            onChange={this.handleFormUpdate}
                            error={Boolean(this.state.errors[num_param])}
                            helperText={(Boolean(this.state.errors[num_param]))
                                ? this.state.errors[num_param]
                                : NumberParameters[num_param].helperText}
                        />
                    </Grid>
                );
            }
        }

        if (this.state[Parameters.type] !== undefined) {
            rendered_parameters.push(
                <Grid item sm={6} className={classes.item}>
                    <FormControl className={classes.formControl} error={Boolean(this.state.errors[Parameters.type])}>
                        <InputLabel htmlFor={Parameters.type}>Type</InputLabel>
                        <Select
                            value={this.state.type}
                            onChange={this.handleFormUpdate}
                            inputProps={{
                                name: Parameters.type,
                                id: Parameters.type,
                            }}
                        >
                            <MenuItem value="node" key={1}>Node</MenuItem>
                            <MenuItem value="edge" key={2}>Edge</MenuItem>
                        </Select>
                        {this.state.errors[Parameters.type]
                            && <FormHelperText error>{this.state.errors[Parameters.type]}</FormHelperText>}
                    </FormControl>
                </Grid>
            );
        }

        if (rendered_parameters.length === 0) {
            return null;
        } else {
            return <React.Fragment>
                <Grid container className={classes.container}>
                    {rendered_parameters}
                </Grid>

                <Divider variant="middle" className={classes.divider} />
            </React.Fragment>
        }
    }

    renderForm() {
        const { classes } = this.props;

        const service = this.props.protoSpec.findServiceByName(this.state.serviceName);
        const serviceMethodNames = service.methodNames;

        return (
            <MuiThemeProvider theme={theme}>
                <div className={classes.root}>
                    <form style={{width: '100%'}}>
                        <Grid container className={classes.container}>
                            <Grid item sm={6} className={classes.item}>
                                <FormControl className={classes.formControl} error={Boolean(this.state.errors['methodName'])}>
                                    <InputLabel htmlFor="methodName">Method Name</InputLabel>
                                    <Select
                                        value={this.state.methodName}
                                        onChange={this.handleFormUpdate}
                                        inputProps={{
                                            name: 'methodName',
                                            id: 'methodName',
                                        }}
                                    >
                                        {this.renderMuiServiceMethodNames(serviceMethodNames)}
                                    </Select>
                                    {this.state.errors['methodName']
                                        && <FormHelperText error>{this.state.errors['methodName']}</FormHelperText>}
                                </FormControl>
                            </Grid>
                        </Grid>

                        <Divider variant="middle" className={classes.divider} />

                        <Grid container className={classes.container}>
                            <Grid item sm className={classes.item}>
                                <FormControl margin='normal' className={classes.formControl}>
                                    <InputLabel htmlFor="inputFormType">Input Type</InputLabel>
                                    <Select
                                        value={this.state.inputType}
                                        onChange={this.handleFormUpdate}
                                        inputProps={{
                                            name: 'inputType',
                                            id: 'inputType',
                                        }}
                                    >
                                        {this.renderMuiFormInputTypes()}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item sm className={classes.item}>
                                <FormControl margin='normal' className={classes.formControl}>
                                    <InputLabel htmlFor="mode">Mode</InputLabel>
                                    <Select
                                        value={this.state.mode}
                                        onChange={this.handleFormUpdate}
                                        inputProps={{
                                            name: 'mode',
                                            id: 'mode',
                                        }}
                                    >
                                        {this.renderMuiModes()}
                                    </Select>
                                </FormControl>
                            </Grid>
                        </Grid>

                        <Divider variant="middle" className={classes.divider} />

                        <Grid container className={classes.container}>
                            <Grid item sm={12} className={classes.item}>
                                {this.renderTextDataInput(classes)}
                            </Grid>
                        </Grid>

                        <Divider variant="middle" className={classes.divider} />

                        {/* Parameters Section */}
                        {
                            this.renderParameters()
                        }

                        <Grid container className={classes.container}>
                            <Grid item sm={6} className={classes.item}>
                                <Button variant="contained" color="primary" className={classes.button}
                                    onClick={this.resetInternalState}>
                                    <ResetIcon className={classes.leftIcon} />
                                    Reset Form
                                </Button>
                            </Grid>
                            <Grid item sm={6} className={classes.item}>
                                <Button variant="contained" color="primary" className={classes.button}
                                    onClick={this.submitAction}>
                                    <CallIcon className={classes.leftIcon} />
                                    Call Service
                                </Button>
                            </Grid>
                        </Grid>
                    </form>
                </div>
            </MuiThemeProvider>
        );
    }

    renderComplete() {
        const { classes } = this.props;

        return (
            <MuiThemeProvider theme={theme}>
                <ReactJson src={this.props.response} theme="apathy:inverted" />
                <div className="row" align="center">
                    <Button variant="contained" color="primary" className={classes.button} onClick={this.download}>
                        Download Results JSON file
                    </Button>
                </div>
            </MuiThemeProvider>
        );
    }

    render() {
        if (this.props.isComplete)
            return (
                <div>
                    {this.renderComplete()}
                </div>
            );
        else {
            return (
                <div>
                    {this.renderForm()}
                </div>
            )
        }
    }

}

NodeImportance.propTypes = {
    classes: PropTypes.object.isRequired,
    theme: PropTypes.object.isRequired,
};

export default withTheme()(withStyles(styles)(NodeImportance));