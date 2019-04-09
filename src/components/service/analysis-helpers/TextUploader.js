import React from "react";
import { relative } from "path";
import PropTypes from 'prop-types';

import Dropzone from "react-dropzone";
import classNames from "classnames";
import { withStyles } from "@material-ui/core/styles";

import { Typography, List, ListItem, ListItemIcon, ListItemText, CircularProgress } from "@material-ui/core";
import { CloudUpload, Check, Error } from "@material-ui/icons";

const styles = theme => ({
    fileInfo: {
        borderRadius: 0,
        position: relative,
        bottom: "5px",
        border: "solid 1px #90D4FF",
        borderTop: "none",
        backgroundColor: "#e1f4ff"
    },
    fileError: {
        borderRadius: 0,
        position: relative,
        bottom: "5px",
        border: "solid 1px #FFB490",
        borderTop: "none",
        backgroundColor: "#ffe4e1"
    },
    errorColor: {
        color: '#f44336',
    },
    successColor: {
        color: "#54C21F",
    },
    dropzone: {
        textAlign: "center",
        padding: "30px",
        border: "dashed 1px #90D4FF"
    },
    dropzoneError: {
        border: "dashed 1px #f44336",
    }
});

class TextUploader extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            texts: [],
            loading: false,
        };

        this.selectedFiles = null;
        this.rejectedFiles = [];

        this.processUploadedFiles = this.processUploadedFiles.bind(this);
        this.renderUploadedFilesInfo = this.renderUploadedFilesInfo.bind(this);
    }

    processUploadedFiles(files) {
        // setup how many files are selected and read
        this.selectedFiles = files.length;

        for (let file of files) {
            if (!file.type.match(this.props.fileAccept)) {
                let file_text = {
                    fileName: file.name,
                    content: null,
                    error: `File '${file.name}' is incorrect type. Supported file type is ${this.props.fileAccept}.`,
                };
                this.setState((state, props) => ({
                    texts: state.texts.concat([file_text])
                }));
            } else {
                const fileReader = new FileReader();
                fileReader.onload = function (e) {
                    let file_text = null;
                    let textContent = e.target.result;
                    let state_error = this.props.validateText("file_text", textContent, file.name);
                    if (state_error["file_text"]) {
                        file_text = {
                            fileName: file.name,
                            content: null,
                            error: state_error["file_text"],
                        };
                    } else {
                        file_text = {
                            fileName: file.name,
                            content: textContent,
                            size: file.size,
                            error: null,
                        };
                    }

                    // update this component state and then its parent state if necessary
                    this.setState((state, props) => ({
                        texts: state.texts.concat([file_text])
                    }), () => {
                        if (this.selectedFiles && this.selectedFiles === this.state.texts.length) {
                            // this means all files are read, let's tell our parent then
                            this.props.handleUploadedTexts(this.state.texts);
                            // and also we have finished loading the files
                            this.setState({ loading: false });
                        }
                    });
                }.bind(this);

                fileReader.readAsText(file);
            }
        }

    }

    renderUploadedFilesInfo() {
        const { classes } = this.props;

        let lastTextIndex = this.state.texts.length;
        let rejectedFilesListItems = this.rejectedFiles.map((rejectedFile, index) => {
            return <ListItem key={lastTextIndex + index} className={classes.fileError}>
                <ListItemIcon>
                    <Error className={classes.errorColor} />
                </ListItemIcon>
                <ListItemText>
                    <Typography variant="body2">
                        {`File '${rejectedFile.name}' is incorrect type. Supported file type is ${this.props.fileAccept}.`}
                    </Typography>
                </ListItemText>

            </ListItem>;
        });

        let textListItems = this.state.texts.map((text, index) => {
            return <ListItem key={index} className={(text.error) ? classes.fileError : classes.fileInfo}>
                <ListItemIcon>
                    {(text.error)
                        ? <Error className={classes.errorColor} />
                        : <Check className={classes.successColor} />
                    }
                </ListItemIcon>
                <ListItemText>
                    <Typography variant="body2">
                        {(text.error)
                            ? text.error
                            : `File '${text.fileName}' selected with ${text.size} bytes size.`}
                    </Typography>
                </ListItemText>

            </ListItem>;
        })


        return <List>
            {textListItems.concat(rejectedFilesListItems)}
        </List>;
    };

    render() {
        const { classes } = this.props;
        console.log("fileError: ", this.props.fileError);

        return (
            <React.Fragment>
                <Dropzone
                    name="dataset"
                    multiple={true}
                    onDrop={
                        files => {
                            // reset texts to empty and start processing uploaded files
                            this.setState({ texts: [], loading: true }, () => {
                                this.processUploadedFiles(files);
                            });
                            return false;
                        }
                    }
                    style={{ marginBottom: "15px" }}
                    accept={this.props.fileAccept}
                >
                    {({ getRootProps, getInputProps, isDragActive, rejectedFiles }) => {
                        this.rejectedFiles = rejectedFiles;

                        return (
                            <div
                                {...getRootProps()}
                                className={classNames(classes.dropzone, {
                                    [classes.dropzoneError]: this.props.parentRejection
                                })}
                            >
                                <input {...getInputProps()} />
                                {
                                    (this.loading)
                                        ? <CircularProgress className={classes.progress} />
                                        : <CloudUpload style={{ fontSize: "48px" }}/>
                                }
                                {
                                    (isDragActive)
                                        ? <Typography variant="body2">Drop dataset here...</Typography>
                                        : <Typography variant="body2">
                                            Click here to select a dataset file, or drag and drop it
                                            over this text. We expect {this.props.fileAccept} to be uploaded.
                                            Other files are disabled.
                                          </Typography>
                                }
                            </div>
                        );
                    }}
                </Dropzone>
                {
                    this.renderUploadedFilesInfo()
                }
            </React.Fragment>
        );
    }
}

TextUploader.propTypes = {
    classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(TextUploader);