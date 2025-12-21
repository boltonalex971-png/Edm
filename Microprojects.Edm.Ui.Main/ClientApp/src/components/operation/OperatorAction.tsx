import {Dialog, DialogActionsBar} from "@progress/kendo-react-dialogs";
import {Field, Form, FormElement, type FormSubmitClickEvent} from "@progress/kendo-react-form";
import {useState} from "react";
import {NumericTextBox} from "@progress/kendo-react-inputs";
import {Button} from "@progress/kendo-react-buttons";
import {Countdown} from "@edm/components/operation/Countdown.tsx";

interface IOperatorActionProps {
    step: {
        parameters: string
        order: number
        description: string
        responseTime: number
    },
    onSubmit: (e: FormSubmitClickEvent) => void
}

export const OperatorAction = ({ step, onSubmit } : IOperatorActionProps) => {
    const [current] = useState<typeof step & {params: string[]}>({ params: step.parameters && JSON.parse(step.parameters), ...step });

    return (
        <Dialog title={<Countdown start={current.responseTime} />} closeIcon={false} >
            <Form
                key={current.order}
                onSubmitClick={onSubmit}
                render={(formRenderProps) => (
                    <FormElement>
                        <div className="action-window">
                            <div className="form">
                                <p>{current.description}</p>

                                {current.params && current.params.map(p =>
                                    <span key={p} className='value'>
                                        <label>{p}</label>
                                        <Field name={p} component={NumericTextBox} />
                                    </span>
                                )}
                            </div>
                            <div className="button" >
                                <DialogActionsBar>
                                    <Button
                                        type='submit'
                                        title='Completed'
                                        icon='check-outline'
                                        themeColor='primary'
                                    >Completed</Button>
                                </DialogActionsBar>
                            </div>
                        </div>
                    </FormElement>
                )}
            />
        </Dialog>
    )
}
