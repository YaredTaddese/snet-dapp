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

const InputType = { File: 'File Upload', Text: 'Textual Input' };
const Parameters = {
    NumOfTopics: 'Number of Topics', TopicDivider: 'Topic Divider', MaxIter: 'Max Iteration', Beta: 'Beta'
};
const DefaultInputs = {
    "docs": [
        "Toward Democratic, Lawful Citizenship for AIs, Robots, and Corporations",
        "Dr. Ben Goertzel, CEO of SingularityNET, shares his thoughts about the AI Citizenship Test",
        "I am writing this on a plane flying away from Malta, where I just spoke about SingularityNET at the Malta Blockchain Summit.",
        "It was my first time on Malta, and after the event, I took the afternoon to explore some of the elegant, quaint, ancient neighborhoods of the island.",
        "Walking through medieval alleyways by the rocky coast, I felt an ironic contrast between my elegant surroundings and the main reason I had decided to allocate a couple days from my insanely busy schedule to this Malta event: not just the conference itself, but also the opportunity to meet with the top levels of the Malta government to discuss the enablement of Maltese citizenship for AIs, robots and automated corporations.",
        "The folks who had built the stone walls lining the narrow Maltese roads, still standing strong centuries later, had probably not foreseen their blue-wave-lapped island becoming a nexus of thinking at the intersection of general intelligence theory, cryptography, distributed systems, and advanced legal theory.",
        "The Hanson Robot Sophia, with whose development I've been intimately involved via my role as Chief Scientist of Hanson Robotics, was granted citizenship of Saudi Arabia this year. This was an exciting landmark event, however, its significance is muddled a bit by the fact that Saudi Arabia is not governed by rule of law in the modern sense.",
        "In a nation governed by rule of law, citizenship has a clearly defined meaning with rights and responsibilities relatively straightforwardly derivable from written legal documents using modern analytical logic (admittedly with some measure of quasi-subjective interpretation via case law).",
        "Saudi Arabian citizenship also has a real meaning, but it's a different sort of meaning\u200a—\u200aderivable from various historical Islamic writings (the Quran, the hadiths, etc.) based on deep contextual interpretation by modern and historical Islamic figures. This is a species of legal interpretation that is understood rather poorly by myself personally, and one that is less easily comprehensible by current AIs.",
        "I'm aware that affiliation with Saudi Arabia in any sense has become controversial in recent weeks due to the apparent murder of Jamal Khashoggi."],
    "num_topics": '2',
    "topic_divider": '0',
    "maxiter": '22',
    "beta": '1'
};

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

class TopicAnalysisService extends React.Component {
    constructor(props) {
        super(props);

        this.handleFormUpdate = this.handleFormUpdate.bind(this);

        // setup validators for each form input
        this.validateTextInput = this.validateTextInput.bind(this);
        this.validateNumOfTopics = this.validateNumOfTopics.bind(this);
        this.validateTopicDivider = this.validateTopicDivider.bind(this);
        this.validateMaxIter = this.validateMaxIter.bind(this);
        this.validateBeta = this.validateBeta.bind(this);
        this.validators = {
            [InputType.Text]: this.validateTextInput,
            [Parameters.NumOfTopics]: this.validateNumOfTopics,
            [Parameters.TopicDivider]: this.validateTopicDivider,
            [Parameters.MaxIter]: this.validateMaxIter,
            [Parameters.Beta]: this.validateBeta,
        };

        this.validateText = this.validateText.bind(this);
        this.validateAllValues = this.validateAllValues.bind(this);
        this.createRequestInputs = this.createRequestInputs.bind(this);

        this.state = this.getInitialState();
        this.resetInternalState = this.resetInternalState.bind(this);

        this.handleUploadedTexts = this.handleUploadedTexts.bind(this);
        this.submitAction = this.submitAction.bind(this);

        this.download = this.download.bind(this);
    }

    /**************************************
     * State related operations
     **************************************/
    getInitialState() {
        return {
            serviceName: "TopicAnalysis",
            methodName: "Select a method",

            file_texts: [],

            // form inputs
            [InputType.Text]: '',
            [Parameters.NumOfTopics]: '4',
            [Parameters.TopicDivider]: '0',
            [Parameters.MaxIter]: '22',
            [Parameters.Beta]: '1',

            errors: {},

            fileAccept: "text/plain",
            inputType: InputType.Text,
        }
    };

    // set error state appropriately
    // since error state is a nested object in state, it needs some workaround
    setErrorState(partial_errors) {
        let nested_error_object = this.state.errors;
        Object.assign(nested_error_object, partial_errors);
        this.setState({ errors: nested_error_object });
    }

    resetInternalState() {
        this.setState(this.getInitialState());
    }

    /****************************************
     * Form validation operations
     ****************************************/
    validateTextInput() {
        return this.validateText(InputType.Text, this.state[InputType.Text]);
    }

    validateText(inputType, textValue, fileName) {
        if (textValue.trim().length === 0) {
            if (fileName) {
                return { [inputType]: `File '${fileName}' is empty. Text should not be empty.` }
            } else {
                return { [inputType]: "Text can not be empty" };
            }
        } else {
            try {
                let json = JSON.parse(textValue);
                if (!(json instanceof Array) || !(json.every(item => typeof item === 'string'))) {
                    if (fileName) {
                        return { [inputType]: `File '${fileName}' content is not an array of strings in JSON format.` };
                    } else {
                        return { [inputType]: `Text must be an array of strings in JSON format.` };
                    }
                } else if (json.length < 2) {
                    if (fileName) {
                        return {
                            [inputType]:
                                `The number of strings in the array of  File '${fileName}' content must be greater than 1.`
                        };
                    } else {
                        return { [inputType]: `The number of strings in the array must be greater than 1.` };
                    }
                }
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
        if (isNaN(float_value)) {
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

    validateNumOfTopics() {
        let validation = this.validateNumber(this.state[Parameters.NumOfTopics], "Number of topics", true);

        if (validation.error) {
            return { [Parameters.NumOfTopics]: validation.error };
        } else if (validation.number < 1) {
            return { [Parameters.NumOfTopics]: "Number of topics isn't big enough for analysis." };
        } else {
            return { [Parameters.NumOfTopics]: null };
        }
    }

    validateTopicDivider() {
        let validation = this.validateNumber(this.state[Parameters.TopicDivider], "Topic divider", true);

        if (validation.error) {
            return { [Parameters.TopicDivider]: validation.error };
        } else if (validation.number < 0) {
            return { [Parameters.TopicDivider]: "Topic divider is less than zero." };
        } else {
            return { [Parameters.TopicDivider]: null };
        }
    }

    validateMaxIter() {
        let validation = this.validateNumber(this.state[Parameters.MaxIter], "Max Iteration", true);

        if (validation.error) {
            return { [Parameters.MaxIter]: validation.error };
        } else if (validation.number <= 0 || validation.number > 500) {
            return {
                [Parameters.MaxIter]:
                    "Max iteration value (maxiter) should have a value greater than 0 and less than 501."
            };
        } else {
            return { [Parameters.MaxIter]: null };
        }
    }

    validateBeta() {
        let validation = this.validateNumber(this.state[Parameters.Beta], "Beta");

        if (validation.error) {
            return { [Parameters.Beta]: validation.error };
        } else if (validation.number <= 0 || validation.number > 1) {
            return {
                [Parameters.Beta]: "Beta should have a value greater than 0 and less than or equal to 1."
            };
        } else {
            return { [Parameters.Beta]: null };
        }
    }

    validateAllValues() {
        // utilize all validators function since we have to validate everything
        let found_errors = {};

        if (this.state.methodName === "Select a method") {
            Object.assign(found_errors, { "methodName": "No method selected." });
        }

        for (let parameter of Object.values(Parameters)) {
            let state_error = this.validators[parameter]();
            if (state_error[parameter]) {
                Object.assign(found_errors, state_error);
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
        const event_target_value = event.target.value;
        console.log('target_value', event.target.value);
        this.setState({ [event_target_name]: event_target_value }, () => {
            // run validation and other codes after ensuring state is updated
            if (event_target_name in this.validators) {
                console.log('validation performed');
                // validate form input change
                let state_error = this.validators[event_target_name]();
                this.setErrorState(state_error);
            }

            if (event_target_name === 'methodName') {
                let state_error = { "methodName": null }

                if (this.state.inputType === InputType.Text) {
                    state_error[InputType.Text] = null;
                    this.setState({ [InputType.Text]: JSON.stringify(DefaultInputs.docs) });
                }

                this.setErrorState(state_error);    // discard errors if there were
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

            request_inputs.num_topics = this.state[Parameters.NumOfTopics];
            request_inputs.topic_divider = this.state[Parameters.TopicDivider];
            request_inputs.maxiter = this.state[Parameters.MaxIter];
            request_inputs.beta = this.state[Parameters.Beta];

            // since JSON format is validated, no parsing trouble is assumed when processing texts
            if (this.state.inputType === InputType.Text) {
                request_inputs.docs = JSON.parse(this.state[InputType.Text]);
            } else {
                let docs = [];
                for (let file_text of this.state.file_texts) {
                    docs = docs.concat(JSON.parse(file_text.content));
                }

                request_inputs.docs = docs;
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
        let resp = this.props.response;
        resp['handle'] = "https://tz-services-1.snet.sh:2298/topic-analysis/api/v1.0/results?handle=" + resp['handle'];
        link.setAttribute('href', "data:text/json," + JSON.stringify(resp));
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
                helperText={this.state.errors[InputType.Text] || 'Text must be an array of strings in JSON format.'}
            />;
        } else if (this.state.inputType === InputType.File) {
            return (<div className={classes.formControl}>
                <TextUploader
                    handleUploadedTexts={this.handleUploadedTexts}
                    validateText={this.validateText}
                    fileAccept={this.state.fileAccept}
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

    renderForm() {
        const { classes } = this.props;

        const service = this.props.protoSpec.findServiceByName(this.state.serviceName);
        const serviceMethodNames = service.methodNames;

        return (
            <MuiThemeProvider theme={theme}>
                <div className={classes.root}>
                    <form>
                        <Grid container className={classes.container}>
                            <Grid item sm className={classes.item}>
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
                        </Grid>
                        <Divider variant="middle" className={classes.divider} />
                        <Grid container className={classes.container}>
                            <Grid item sm={12} className={classes.item}>
                                {this.renderTextDataInput(classes)}
                            </Grid>
                        </Grid>

                        <Divider variant="middle" className={classes.divider} />
                        <Grid container className={classes.container}>
                            <Grid item sm={6} className={classes.item}>
                                <TextField className={classes.formControl}
                                    id={Parameters.NumOfTopics}
                                    name={Parameters.NumOfTopics}
                                    label="Number of Topics"
                                    type="number"
                                    margin="normal"
                                    value={this.state[Parameters.NumOfTopics]}
                                    onChange={this.handleFormUpdate}
                                    error={Boolean(this.state.errors[Parameters.NumOfTopics])}
                                    helperText={(Boolean(this.state.errors[Parameters.NumOfTopics]))
                                        ? this.state.errors[Parameters.NumOfTopics]
                                        : "Number of topics to be extracted"}
                                />
                            </Grid>
                            <Grid item sm={6} className={classes.item}>
                                <TextField className={classes.formControl}
                                    id={Parameters.TopicDivider}
                                    name={Parameters.TopicDivider}
                                    label="Topic Divider"
                                    type="number"
                                    margin="normal"
                                    value={this.state[Parameters.TopicDivider]}
                                    onChange={this.handleFormUpdate}
                                    error={Boolean(this.state.errors[Parameters.TopicDivider])}
                                    helperText={(Boolean(this.state.errors[Parameters.TopicDivider]))
                                        ? this.state.errors[Parameters.TopicDivider]
                                        : "Number of topic dividers"}
                                />
                            </Grid>
                            <Grid item sm={6} className={classes.item}>
                                <TextField className={classes.formControl}
                                    id={Parameters.MaxIter}
                                    name={Parameters.MaxIter}
                                    label="Max Iteration"
                                    type="number"
                                    margin="normal"
                                    value={this.state[Parameters.MaxIter]}
                                    onChange={this.handleFormUpdate}
                                    error={Boolean(this.state.errors[Parameters.MaxIter])}
                                    helperText={(Boolean(this.state.errors[Parameters.MaxIter]))
                                        ? this.state.errors[Parameters.MaxIter]
                                        : "Maximum number of Iteration"}
                                />
                            </Grid>
                            <Grid item sm={6} className={classes.item}>
                                <TextField className={classes.formControl}
                                    id={Parameters.Beta}
                                    name={Parameters.Beta}
                                    label="Beta"
                                    type="number"
                                    margin="normal"
                                    value={this.state[Parameters.Beta]}
                                    onChange={this.handleFormUpdate}
                                    error={Boolean(this.state.errors[Parameters.Beta])}
                                    helperText={(Boolean(this.state.errors[Parameters.Beta]))
                                        ? this.state.errors[Parameters.Beta]
                                        : "Beta value of the topic function"}
                                />
                            </Grid>
                        </Grid>
                        <Divider variant="middle" className={classes.divider} />
                        <Grid container className={classes.container}>
                            <Grid item sm={6} className={classes.item}>
                                <Button variant="contained" color="primary" className={classes.button}
                                    onClick={this.resetInternalState}>
                                    <ResetIcon className={classes.leftIcon} />
                                    Reset Form Inputs
                                </Button>
                            </Grid>
                            <Grid item sm={6} className={classes.item}>
                                <Button variant="contained" color="primary" className={classes.button}
                                    onClick={this.submitAction}>
                                    <CallIcon className={classes.leftIcon} />
                                    Call Topic Analysis
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
        let response = [this.props.response];

        response['handle'] = "https://tz-services-1.snet.sh:2298/topic-analysis/api/v1.0/results?handle=" + response['handle'];
        return (
            <MuiThemeProvider theme={theme}>
                <Card
                    style={{
                        backgroundColor: "#deffde"
                    }}
                    elevation={0}
                >
                    <CardContent className={classes.centerText}>
                        <h4>
                            <CheckCircle style={{ fontSize: "36px", color: "#54C21F", textAlign: "center" }} />
                            <br />
                            Analysis started!
                        </h4>
                        <Typography variant="body2">
                            Follow the link below to check the status of the analysis.
                        </Typography>
                        <p
                            style={{
                                marginTop: "15px",
                                backgroundColor: "#fff",
                                border: "5px",
                                padding: "10px",
                                borderRadius: "5px"
                            }}
                        >
                            <a
                                rel="noopener noreferrer"
                                target="_blank"
                                href={"https://tz-services-1.snet.sh:2298/topic-analysis/api/v1.0/results?handle=" + this.props.response['handle']}
                            >
                                {"https://tz-services-1.snet.sh:2298/topic-analysis/api/v1.0/results?handle=" + this.props.response['handle']}
                            </a>
                        </p>
                    </CardContent>
                </Card>
                <hr
                    style={{
                        color: 'red',
                        backgroundColor: 'color',
                        height: 5
                    }}
                />
                <ReactJson src={response} theme="apathy:inverted" />
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

TopicAnalysisService.propTypes = {
    classes: PropTypes.object.isRequired,
    theme: PropTypes.object.isRequired,
};

export default withTheme()(withStyles(styles)(TopicAnalysisService));