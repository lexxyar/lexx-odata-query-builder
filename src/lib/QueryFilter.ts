export enum QueryFilterSign {
  EQ = 'eq',
  GT = 'gt',
  GE = 'ge',
  LT = 'lt',
  LE = 'le',
  NE = 'ne',
  SUBSTRINGOF = "substringof",
  STARTSWITH = "startswith",
  ENDSWITH = "endswith",
}

export enum QueryFilterConcatenate {
  AND = 'and',
  OR = 'or'
}

export class QueryFilter {
  private _sField = ''
  private _sValue = ''
  private _sOption = QueryFilterSign.EQ
  private _sConcat = QueryFilterConcatenate.AND
  private _aChildFilter: QueryFilter[] = []

  constructor(mField: string | QueryFilter, sValue: any = '', sOption = QueryFilterSign.EQ) {
    if (typeof mField === 'string') {
      this._sField = mField
      this._sValue = `'${sValue}'`
      this._sOption = sOption
    } else {
      this._aChildFilter.push(mField)
    }
  }

  private _add(oFilter: QueryFilter, sConcat = QueryFilterConcatenate.AND): void {
    oFilter.concat = sConcat
    this._aChildFilter.push(oFilter)
  }

  private _toFilter(sField: string, sValue: any = '', sOption = QueryFilterSign.EQ): QueryFilter {
    return new QueryFilter(sField, sValue, sOption)
  }

  or(mFilter: QueryFilter | string, sValue: any = '', sOption = QueryFilterSign.EQ): void {
    if (typeof mFilter === 'string') {
      this._add(this._toFilter(mFilter, sValue, sOption), QueryFilterConcatenate.OR)
    } else if (mFilter instanceof QueryFilter) {
      this._add(mFilter, QueryFilterConcatenate.OR)
    }
  }

  and(mFilter: QueryFilter | string, sValue: any = '', sOption = QueryFilterSign.EQ): void {
    if (typeof mFilter === 'string') {
      this._add(this._toFilter(mFilter, sValue, sOption), QueryFilterConcatenate.AND)
    } else if (mFilter instanceof QueryFilter) {
      this._add(mFilter, QueryFilterConcatenate.AND)
    }
  }

  set concat(sValue: QueryFilterConcatenate) {
    this._sConcat = sValue
  }

  build(bWithConcat = false): string {
    const aFilter = [this._toString(bWithConcat)]
    this._aChildFilter.map(item => {
      aFilter.push(item.build(true))
    })
    return aFilter.join(' ')
  }

  private _toString(bWithConcat = false): string {
    const aResult = [this._sField, this._sOption, this._sValue]
    if ([
      QueryFilterSign.SUBSTRINGOF,
      QueryFilterSign.STARTSWITH,
      QueryFilterSign.ENDSWITH,
    ].findIndex((item: string) => this._sOption === item) >= 0) {
      aResult[0] = `${this._sOption}(${this._sField}, ${this._sValue})`
      aResult[1] = `eq`
      aResult[2] = `true`
    }

    if (bWithConcat) {
      aResult.unshift(this._sConcat)
    }
    return aResult.join(' ')
  }
}