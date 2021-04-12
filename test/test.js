const {strictEqual} = require("assert")

const {QueryBuilder, QueryOrder, QueryOrderDirection, QueryFilter, QueryFilterSign} = require("../dist");


const sUrl = 'http://crm/odata/employe'

describe('oData query builder', function () {
  it('Simple URL `http://crm/odata/employe`', function () {
    const o = new QueryBuilder(sUrl)
    strictEqual(o.build(), sUrl)
  });

  describe('Ordering', function () {
    it('Order `name1 asc`', function () {
      const o = new QueryBuilder(sUrl)
      o.order(new QueryOrder('name1'))
      strictEqual(o.build(), `${sUrl}?$orderby=name1 asc`)
    });
    it('Order `name2 desc`', function () {
      const o = new QueryBuilder(sUrl)
      o.order(new QueryOrder('name2', QueryOrderDirection.DESC))
      strictEqual(o.build(), `${sUrl}?$orderby=name2 desc`)
    });
    it('Order `name1 asc` and `name2 desc`', function () {
      const o = new QueryBuilder(sUrl)
      o.order(new QueryOrder('name1')).order(new QueryOrder('name2', QueryOrderDirection.DESC))
      strictEqual(o.build(), `${sUrl}?$orderby=name1 asc,name2 desc`)
    });
  });

  describe('Expanding', function () {
    it('Expand `company`', function () {
      const o = new QueryBuilder(sUrl)
      o.expand('company')
      strictEqual(o.build(), `${sUrl}?$expand=company`)
    });
    it('Expand `company` and `jobtitle`', function () {
      const o = new QueryBuilder(sUrl)
      o.expand('company').expand('jobtitle')
      strictEqual(o.build(), `${sUrl}?$expand=company,jobtitle`)
    });
  });

  describe('Limiting', function () {
    it('Top 7', function () {
      const o = new QueryBuilder(sUrl)
      o.top(7)
      strictEqual(o.build(), `${sUrl}?$top=7`)
    });
    it('Shift 4', function () {
      const o = new QueryBuilder(sUrl)
      o.offset(4)
      strictEqual(o.build(), `${sUrl}?$skip=4`)
    });
    it('Top 7 and Shift 4', function () {
      const o = new QueryBuilder(sUrl)
      o.limit(7).shift(4)
      strictEqual(o.build(), `${sUrl}?$top=7&$skip=4`)
    });
  });

  describe('Paging', function () {
    it('Default (10 records per page)', function () {
      const o = new QueryBuilder(sUrl)
      o.page(3)
      strictEqual(o.build(), `${sUrl}?$top=10&$skip=20`)
    });
    it('Configured (5 records per page)', function () {
      const o = new QueryBuilder(sUrl, {rowsPerPage: 5})
      o.page(3)
      strictEqual(o.build(), `${sUrl}?$top=5&$skip=10`)
    });
  });

  describe('Filtering', function () {
    it('gender eq `f`', function () {
      const o = new QueryBuilder(sUrl)
      o.filter(new QueryFilter('gender', 'f'))
      strictEqual(o.build(), `${sUrl}?$filter=gender eq f`)
    });
    it('age gt 16', function () {
      const o = new QueryBuilder(sUrl)
      o.filter(new QueryFilter('age', 16, QueryFilterSign.GT))
      strictEqual(o.build(), `${sUrl}?$filter=age gt 16`)
    });
    it('gender eq `f` and age gt 16', function () {
      const o = new QueryBuilder(sUrl)
      const oFilter = new QueryFilter('gender', 'f')
      oFilter.and('age', 16, QueryFilterSign.GT)
      o.filter(oFilter)
      strictEqual(o.build(), `${sUrl}?$filter=gender eq f and age gt 16`)
    });
  });

  describe('Counting', function () {
    it('Simple count', function () {
      const o = new QueryBuilder(sUrl)
      o.count()
      strictEqual(o.build(), `${sUrl}/$count`)
    });
    it('Count with filter, where age gt 16', function () {
      const o = new QueryBuilder(sUrl)
      o.filter(new QueryFilter('age', 16, QueryFilterSign.GT)).count()
      strictEqual(o.build(), `${sUrl}/$count?$filter=age gt 16`)
    });
  });

  describe('Misc', function () {
    it('By ID', function () {
      const o = new QueryBuilder(sUrl)
      o.id(4)
      strictEqual(o.build(), `${sUrl}(4)`)
    });
    it('$force (Laravel extra)', function () {
      const o = new QueryBuilder(sUrl)
      o.force()
      strictEqual(o.build(), `${sUrl}?$force=true`)
    });
  });
});