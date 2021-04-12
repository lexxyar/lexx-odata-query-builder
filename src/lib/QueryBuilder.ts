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

  constructor(private _sUrl: string, private _oConfig?: QueryBuilderConfig) {
  }

  get url(): string {
    return this._sUrl
  }

  id(mId: string | number): QueryBuilder {
    this._nId = Number(mId)
    return this
  }

  force(): QueryBuilder {
    this._bForce = true
    return this
  }

  expand(mEntity: string | string[]): QueryBuilder {
    if (Array.isArray(mEntity)) {
      this._aExpand = this._aExpand.concat(mEntity)
    } else if (typeof (mEntity) === 'string') {
      this._aExpand.push(mEntity)
    }
    return this
  }

  limit(nValue: number): QueryBuilder {
    this._nLimit = nValue
    this._bUseLimit = true
    return this
  }

  /**
   * @alias limit
   * @param nValue
   * @returns {QueryBuilder}
   */
  top(nValue: number): QueryBuilder {
    return this.limit(nValue)
  }

  offset(nValue: number): QueryBuilder {
    this._nOffset = nValue
    return this
  }

  /**
   * @alias offset
   * @param nValue
   */
  skip(nValue: number): QueryBuilder {
    return this.offset(nValue)
  }

  /**
   * @alias offset
   * @param nValue
   */
  shift(nValue: number): QueryBuilder {
    return this.offset(nValue)
  }

  getFilter(): QueryFilter | null {
    return this._oFilter
  }

  filter(oFilter: QueryFilter): QueryBuilder {
    this._oFilter = oFilter
    return this
  }

  order(oOrder: QueryOrder): QueryBuilder {
    this._aOrder.push(oOrder)
    return this
  }

  /**
   * Alias for order
   * @param oOrder
   * @returns {QueryBuilder}
   */
  orderby(oOrder: QueryOrder): QueryBuilder {
    return this.order(oOrder)
  }

  page(nPage: number): QueryBuilder {
    nPage = nPage < 2 ? 1 : nPage
    const nRowsPerPage = this._oConfig?.rowsPerPage ? this._oConfig.rowsPerPage : 10
    const nShift = (nPage - 1) * nRowsPerPage
    this.limit(nRowsPerPage).offset(nShift)
    return this
  }

  count(): QueryBuilder {
    this._bCount = true
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

    if (this._bForce) {
      aQuery.push('$force=true')
    }

    const sUrl = [this._sUrl]
    if (this._nId) {
      sUrl.push(`(${this._nId})`)
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