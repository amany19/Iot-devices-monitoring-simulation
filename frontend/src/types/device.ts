import type {ReadingType} from "./index ";

export default interface Device{
    id?:number
    name:string
    code:string
    location:string
    status:"on"|"off"

    humidity_max:number
    humidity_min:number
    temperature_max:number
    temperature_min:number
    readings?:ReadingType[]
}