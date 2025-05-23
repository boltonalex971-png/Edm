import * as React from "react";
import {ComboBox, ComboBoxProps} from "@progress/kendo-react-dropdowns";
import {useGet} from "../hooks/hooks";
import {UUID} from "@logistics/data/types";

type LinkableComboBoxProps = ComboBoxProps & React.RefAttributes<any> & {
}
export const LinkableComboBox = (props: LinkableComboBoxProps) => {
    const value = props.value && typeof props.value === "string" ? props.data?.find(d => d['id'] === props.value) : props.value;
    return (
        <ComboBox {...props} dataItemKey={'id'} textField={'name'} value={value} />
    )
}