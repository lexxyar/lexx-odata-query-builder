export enum QueryOrderDirection {
  ASC = 'asc',
  DESC = 'desc'
}

export class QueryOrder {
  private _aList: Map<string, string>[] = []

  constructor(sField: string = '', sDirection = QueryOrderDirection.ASC) {
    if (!!sField) {
      this.add(sField, sDirection)
    }
  }

  add(sField: string, sDirection = QueryOrderDirection.ASC) {
    const obj = new Map<string, string>()
    obj.set(sField, sDirection)
    this._aList.push(obj)
  }

  build(): string {
    const aResult: string[] = []
    this._aList.map((itm) => {
      const aKey = Array.from(itm.keys())
      const sKey = aKey[0]
      aResult.push(`${sKey} ${itm.get(sKey)}`)
    })
    return aResult.join(',')
  }
}
