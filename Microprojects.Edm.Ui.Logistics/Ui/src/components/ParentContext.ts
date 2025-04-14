import { createContext } from "react";
import type {DataItem} from "../data/types";


export const ParentContext = createContext({ itemUpdate: (item : DataItem) : void => {} })