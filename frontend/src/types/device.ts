import type {ReadingType} from "./index ";

export default interface Device{
    id?:string
    name:string
    code:string
    location:string
    status:"on"|"off"
    normalTemperatureRange:{min:number,max:number}
    normalHumidityRange:{min:number,max:number}
    readings?:ReadingType[]
}