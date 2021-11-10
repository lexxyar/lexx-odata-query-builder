import {QueryFilter} from "./QueryFilter";
import {QueryOrder} from "./QueryOrder";

export interface QueryBuilderConfig {
  rowsPerPage?: number
}

export class QueryBuilder {
  private _aExpand: string[] = []
  private _nLimit = 10
  private _nOffset = 0
  private _bUseLimit = false
  private _oFilter: QueryFilter | null = null
  private _aOrder: QueryOrder[] = []
  private _bCount = false
  private _nId = 0
  private _bForce = false
  private _aSelect: string[] = []
  private _bFileContent = false
  private _bFileContentBase64 = false
  private _aAttach: string[] = []

  constructor(private _sUrl: string, private _oConfig?: QueryBuilderConfig) {
  }

  get url(): string {
    return this._sUrl
  }

  id(mId: string | number): this {
    this._nId = Number(mId)
    return this
  }

  force(): this {
    this._bForce = true
    return this
  }

  expand(mEntity: string | string[]): this {
    if (Array.isArray(mEntity)) {
      this._aExpand = this._aExpand.concat(mEntity)
    } else if (typeof (mEntity) === 'string') {
      this._aExpand.push(mEntity)
    }
    return this
  }

  select(mField: string | string[]): this {
    if (Array.isArray(mField)) {
      this._aSelect = this._aSelect.concat(mField)
    } else if (typeof (mField) === 'string') {
      this._aSelect.push(mField)
    }
    return this
  }

  attach(mField: string | string[]): this {
    if (Array.isArray(mField)) {
      this._aAttach = this._aAttach.concat(mField)
    } else if (typeof (mField) === 'string') {
      this._aAttach.push(mField)
    }
    return this
  }

  limit(nValue: number): this {
    this._nLimit = nValue
    this._bUseLimit = true
    return this
  }

  /**
   * @alias limit
   * @param nValue
   * @returns {QueryBuilder}
   */
  top(nValue: number): this {
    return this.limit(nValue)
  }

  offset(nValue: number): this {
    this._nOffset = nValue
    return this
  }

  /**
   * @alias offset
   * @param nValue
   */
  skip(nValue: number): this {
    return this.offset(nValue)
  }

  /**
   * @alias offset
   * @param nValue
   */
  shift(nValue: number): this {
    return this.offset(nValue)
  }

  getFilter(): QueryFilter | null {
    return this._oFilter
  }

  filter(oFilter: QueryFilter): this {
    this._oFilter = oFilter
    return this
  }

  order(oOrder: QueryOrder): this {
    this._aOrder.push(oOrder)
    return this
  }

  /**
   * Alias for order
   * @param oOrder
   * @returns {QueryBuilder}
   */
  orderby(oOrder: QueryOrder): this {
    return this.order(oOrder)
  }

  page(nPage: number): this {
    nPage = nPage < 2 ? 1 : nPage
    const nRowsPerPage = this._oConfig?.rowsPerPage ? this._oConfig.rowsPerPage : 10
    const nShift = (nPage - 1) * nRowsPerPage
    this.limit(nRowsPerPage).offset(nShift)
    return this
  }

  count(): this {
    this._bCount = true
    return this
  }

  asFileContent(): this {
    this._bFileContentBase64 = false
    this._bFileContent = true
    return this
  }

  asFileContentBase64(): this {
    this._bFileContentBase64 = true
    this._bFileContent = false
    return this
  }

  build(): string {
    const aQuery: string[] = []
    if (!this._nId) {
      if (!this._bCount) {
        if (this._bUseLimit) {
          aQuery.push(`$top=${this._nLimit}`)
        }
        if (this._nOffset > 0) {
          aQuery.push(`$skip=${this._nOffset}`)
        }

        if (this._aOrder.length > 0) {
          const aOrder: string[] = []
          this._aOrder.map((oOrder) => {
            aOrder.push(oOrder.build())
          })
          aQuery.push('$orderby=' + aOrder.join(','))
        }
      }
      if (this._oFilter !== null) {
        aQuery.push('$filter=' + this._oFilter.build())
      }
    }

    if (this._aExpand.length > 0) {
      aQuery.push('$expand=' + this._aExpand.join(','))
    }

    if (this._aSelect.length > 0) {
      aQuery.push('$select=' + this._aSelect.join(','))
    }

    if (this._bForce) {
      aQuery.push('_force=true')
    }

    if (this._aAttach.length > 0) {
      aQuery.push('_attach=' + this._aAttach.join(','))
    }

    const sUrl = [this._sUrl]
    if (this._nId) {
      sUrl.push(`(${this._nId})`)
      if (this._bFileContent) {
        sUrl.push(`/_file`)
      } else if (this._bFileContentBase64) {
        sUrl.push(`/_file64`)
      }
    } else {
      sUrl.push(this._bCount ? '/$count' : '')
    }
    if (aQuery.length > 0) {
      sUrl.push('?')
      sUrl.push(aQuery.join('&'))
    }

    this._bUseLimit = false
    this._bCount = false
    return sUrl.join('')
  }
}